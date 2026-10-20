/**
 * API Client Generator
 *
 * Generates API client code from captured network activity
 */

import type { NetworkMap, APIEndpoint, GraphQLQuery } from '../capture/NetworkCapture';

export class APIGenerator {
  /**
   * Generate complete API client
   */
  async generate(networkMap: NetworkMap): Promise<Map<string, string>> {
    const files = new Map<string, string>();

    // Generate base client
    files.set('api/client.ts', this.generateBaseClient());

    // Generate REST endpoints
    if (networkMap.endpoints.length > 0) {
      const restClient = this.generateRESTClient(networkMap.endpoints);
      files.set('api/rest.ts', restClient);
    }

    // Generate GraphQL client
    if (networkMap.graphql.length > 0) {
      const graphqlClient = this.generateGraphQLClient(networkMap.graphql);
      files.set('api/graphql.ts', graphqlClient);
    }

    // Generate types
    const types = this.generateTypes(networkMap);
    files.set('api/types.ts', types);

    return files;
  }

  /**
   * Generate base HTTP client
   */
  private generateBaseClient(): string {
    return `export class APIClient {
  private baseURL: string;
  private headers: Record<string, string>;

  constructor(baseURL: string, headers: Record<string, string> = {}) {
    this.baseURL = baseURL;
    this.headers = {
      'Content-Type': 'application/json',
      ...headers
    };
  }

  async request<T>(
    path: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = \`\${this.baseURL}\${path}\`;

    const response = await fetch(url, {
      ...options,
      headers: {
        ...this.headers,
        ...options.headers
      }
    });

    if (!response.ok) {
      throw new Error(\`HTTP error! status: \${response.status}\`);
    }

    return response.json();
  }

  async get<T>(path: string): Promise<T> {
    return this.request<T>(path, { method: 'GET' });
  }

  async post<T>(path: string, data: any): Promise<T> {
    return this.request<T>(path, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async put<T>(path: string, data: any): Promise<T> {
    return this.request<T>(path, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async delete<T>(path: string): Promise<T> {
    return this.request<T>(path, { method: 'DELETE' });
  }
}

export const apiClient = new APIClient(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000');`;
  }

  /**
   * Generate REST API client
   */
  private generateRESTClient(endpoints: APIEndpoint[]): string {
    // Group endpoints by base path
    const grouped = this.groupEndpoints(endpoints);

    const methods: string[] = [];

    Object.entries(grouped).forEach(([basePath, endpoints]) => {
      endpoints.forEach(endpoint => {
        const method = this.generateEndpointMethod(endpoint);
        methods.push(method);
      });
    });

    return `import { apiClient } from './client';

export const api = {
${methods.map(m => '  ' + m).join(',\n\n')}
};`;
  }

  /**
   * Generate method for single endpoint
   */
  private generateEndpointMethod(endpoint: APIEndpoint): string {
    const methodName = this.generateMethodName(endpoint);
    const params = this.generateParams(endpoint);
    const returnType = 'any'; // Would infer from responseShape

    if (endpoint.method === 'GET') {
      return `${methodName}: (${params}) => apiClient.get<${returnType}>(\`${endpoint.path}\`)`;
    } else if (endpoint.method === 'POST') {
      return `${methodName}: (data: any) => apiClient.post<${returnType}>('${endpoint.path}', data)`;
    } else if (endpoint.method === 'PUT') {
      return `${methodName}: (id: string, data: any) => apiClient.put<${returnType}>(\`${endpoint.path}/\${id}\`, data)`;
    } else if (endpoint.method === 'DELETE') {
      return `${methodName}: (id: string) => apiClient.delete<${returnType}>(\`${endpoint.path}/\${id}\`)`;
    }

    return `${methodName}: () => apiClient.get<${returnType}>('${endpoint.path}')`;
  }

  /**
   * Generate GraphQL client
   */
  private generateGraphQLClient(queries: GraphQLQuery[]): string {
    const queryMethods = queries.map(q => {
      const name = q.operationName || 'query';
      return `  ${name}: (variables?: any) => graphqlClient.query(\`${q.query}\`, variables)`;
    });

    return `import { GraphQLClient } from 'graphql-request';

const graphqlClient = new GraphQLClient(process.env.NEXT_PUBLIC_GRAPHQL_URL || 'http://localhost:3000/graphql');

export const graphql = {
${queryMethods.join(',\n\n')}
};`;
  }

  /**
   * Generate TypeScript types
   */
  private generateTypes(networkMap: NetworkMap): string {
    const types: string[] = [];

    // Generate types from response shapes
    networkMap.endpoints.forEach((endpoint, index) => {
      if (endpoint.responseShape) {
        const typeName = this.generateTypeName(endpoint);
        const typeDefinition = this.inferTypeFromShape(endpoint.responseShape);
        types.push(`export interface ${typeName} ${typeDefinition}`);
      }
    });

    return types.join('\n\n');
  }

  /**
   * Group endpoints by base path
   */
  private groupEndpoints(endpoints: APIEndpoint[]): Record<string, APIEndpoint[]> {
    const grouped: Record<string, APIEndpoint[]> = {};

    endpoints.forEach(endpoint => {
      const basePath = endpoint.path.split('/')[1] || 'default';
      if (!grouped[basePath]) {
        grouped[basePath] = [];
      }
      grouped[basePath].push(endpoint);
    });

    return grouped;
  }

  /**
   * Generate method name from endpoint
   */
  private generateMethodName(endpoint: APIEndpoint): string {
    const path = endpoint.path.replace(/^\//, '').replace(/\//g, '_');
    const method = endpoint.method.toLowerCase();

    return `${method}${path.charAt(0).toUpperCase() + path.slice(1)}`;
  }

  /**
   * Generate parameters from endpoint
   */
  private generateParams(endpoint: APIEndpoint): string {
    const params: string[] = [];

    // Extract path parameters
    const pathParams = endpoint.path.match(/:\w+/g);
    if (pathParams) {
      pathParams.forEach(param => {
        params.push(`${param.slice(1)}: string`);
      });
    }

    // Add query parameters
    if (endpoint.queryParams && Object.keys(endpoint.queryParams).length > 0) {
      params.push('params?: Record<string, string>');
    }

    return params.join(', ');
  }

  /**
   * Generate type name from endpoint
   */
  private generateTypeName(endpoint: APIEndpoint): string {
    const path = endpoint.path.replace(/^\//, '').replace(/\//g, '_').replace(/[^a-zA-Z0-9_]/g, '');
    return `${path.charAt(0).toUpperCase() + path.slice(1)}Response`;
  }

  /**
   * Infer TypeScript type from object shape
   */
  private inferTypeFromShape(shape: object): string {
    const properties: string[] = [];

    Object.entries(shape).forEach(([key, value]) => {
      const type = this.inferType(value);
      properties.push(`  ${key}: ${type};`);
    });

    return `{\n${properties.join('\n')}\n}`;
  }

  /**
   * Infer TypeScript type from value
   */
  private inferType(value: any): string {
    if (Array.isArray(value)) {
      if (value.length > 0) {
        return `${this.inferType(value[0])}[]`;
      }
      return 'any[]';
    }

    if (typeof value === 'object' && value !== null) {
      return this.inferTypeFromShape(value);
    }

    if (typeof value === 'string') return 'string';
    if (typeof value === 'number') return 'number';
    if (typeof value === 'boolean') return 'boolean';

    return 'any';
  }
}
