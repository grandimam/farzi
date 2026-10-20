/**
 * Network Capture
 *
 * Captures all network activity:
 * - API endpoints
 * - Request/response shapes
 * - GraphQL queries
 * - WebSocket connections
 */

import type { Page, Route, Request, APIResponse } from 'playwright';

export interface APIEndpoint {
  url: string;
  method: string;
  baseURL: string;
  path: string;
  requestShape?: object;
  responseShape?: object;
  headers: Record<string, string>;
  queryParams?: Record<string, string>;
}

export interface GraphQLQuery {
  operationName: string;
  query: string;
  variables?: object;
  response?: object;
}

export interface WebSocketConnection {
  url: string;
  messages: WebSocketMessage[];
}

export interface WebSocketMessage {
  type: 'send' | 'receive';
  data: any;
  timestamp: number;
}

export interface NetworkMap {
  endpoints: APIEndpoint[];
  graphql: GraphQLQuery[];
  websockets: WebSocketConnection[];
}

export class NetworkCapture {
  private requests: Array<{ request: Request; response?: APIResponse }> = [];

  /**
   * Capture all network activity
   */
  async capture(page: Page): Promise<NetworkMap> {
    // Intercept all network requests
    await page.route('**/*', async (route: Route) => {
      const request = route.request();

      // Continue the request and capture response
      const response = await route.fetch();

      this.requests.push({ request, response });

      await route.fulfill({ response });
    });

    // Navigate and let network requests happen
    // (calling code will navigate)

    // Wait a bit for network to settle
    await page.waitForLoadState('networkidle');

    // Analyze captured requests
    return this.analyzeNetwork();
  }

  /**
   * Analyze captured network requests
   */
  private async analyzeNetwork(): Promise<NetworkMap> {
    const endpoints: APIEndpoint[] = [];
    const graphql: GraphQLQuery[] = [];
    const websockets: WebSocketConnection[] = [];

    for (const { request, response } of this.requests) {
      const url = new URL(request.url());

      // Skip static assets
      if (this.isStaticAsset(url)) continue;

      // Check if GraphQL
      if (this.isGraphQL(request)) {
        const query = await this.extractGraphQL(request, response);
        if (query) graphql.push(query);
      }
      // Regular REST API
      else if (this.isAPI(url)) {
        const endpoint = await this.extractEndpoint(request, response);
        endpoints.push(endpoint);
      }
    }

    return { endpoints, graphql, websockets };
  }

  /**
   * Check if request is for a static asset
   */
  private isStaticAsset(url: URL): boolean {
    const ext = url.pathname.split('.').pop()?.toLowerCase();
    return ['js', 'css', 'png', 'jpg', 'jpeg', 'gif', 'svg', 'woff', 'woff2', 'ttf', 'ico'].includes(ext || '');
  }

  /**
   * Check if request is GraphQL
   */
  private isGraphQL(request: Request): boolean {
    const url = request.url();
    const body = request.postData();

    return url.includes('graphql') ||
           (body && (body.includes('query') || body.includes('mutation')));
  }

  /**
   * Check if request is an API call
   */
  private isAPI(url: URL): boolean {
    return url.pathname.includes('/api/') ||
           url.pathname.startsWith('/v1/') ||
           url.hostname !== location.hostname;
  }

  /**
   * Extract GraphQL query
   */
  private async extractGraphQL(request: Request, response?: APIResponse): Promise<GraphQLQuery | null> {
    const body = request.postData();
    if (!body) return null;

    try {
      const parsed = JSON.parse(body);
      const responseData = response ? await response.json().catch(() => null) : null;

      return {
        operationName: parsed.operationName || 'unknown',
        query: parsed.query,
        variables: parsed.variables,
        response: responseData
      };
    } catch (e) {
      return null;
    }
  }

  /**
   * Extract API endpoint info
   */
  private async extractEndpoint(request: Request, response?: APIResponse): Promise<APIEndpoint> {
    const url = new URL(request.url());
    const headers: Record<string, string> = {};

    request.headers();
    Object.entries(request.headers()).forEach(([key, value]) => {
      headers[key] = value;
    });

    // Extract request shape
    let requestShape: object | undefined;
    const postData = request.postData();
    if (postData) {
      try {
        requestShape = JSON.parse(postData);
      } catch (e) {
        // Not JSON
      }
    }

    // Extract response shape
    let responseShape: object | undefined;
    if (response) {
      try {
        responseShape = await response.json();
      } catch (e) {
        // Not JSON
      }
    }

    // Extract query params
    const queryParams: Record<string, string> = {};
    url.searchParams.forEach((value, key) => {
      queryParams[key] = value;
    });

    return {
      url: request.url(),
      method: request.method(),
      baseURL: url.origin,
      path: url.pathname,
      headers,
      queryParams: Object.keys(queryParams).length > 0 ? queryParams : undefined,
      requestShape,
      responseShape
    };
  }
}
