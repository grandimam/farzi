# Farzi Usage Examples

Real-world examples of using Farzi MCP server with Claude.

## Setup

Once you've configured Farzi in Claude Desktop (see [MCP_SETUP.md](./MCP_SETUP.md)), you can use it by simply talking to Claude.

---

## Example 1: Clone an Entire Application

**You:** Clone https://linear.app to ./my-linear-clone using React

**Claude will:**
1. Use `farzi_analyze` to understand the tech stack
2. Use `farzi_replicate` to generate the complete replica
3. Report results including:
   - Detected framework
   - State management pattern
   - API endpoints found
   - Component count
   - Validation results

**Output:**
```
./my-linear-clone/
├── src/
│   ├── components/
│   │   ├── IssueCard.tsx
│   │   ├── Sidebar.tsx
│   │   └── ...
│   ├── design-system/
│   │   ├── tokens/
│   │   │   ├── colors.ts       # #5E6AD2 etc from pixel scan
│   │   │   ├── spacing.ts      # 4px base, 8px scale
│   │   │   └── typography.ts
│   │   └── components/
│   │       ├── Button.tsx
│   │       └── Input.tsx
│   ├── store/
│   │   ├── index.ts            # Redux/Zustand detected
│   │   └── issuesSlice.ts
│   ├── api/
│   │   ├── rest.ts             # Type-safe clients
│   │   └── graphql.ts
│   └── pages/
│       └── Dashboard.tsx
├── package.json
├── tailwind.config.js          # Design tokens as Tailwind config
└── tsconfig.json
```

---

## Example 2: Extract Design System

**You:** What design tokens does Stripe use for their pricing page?

**Claude will:**
1. Use `farzi_extract_design` on https://stripe.com/pricing
2. Analyze the results
3. Present findings in human-readable format

**Response:**
```
Stripe's pricing page uses:

Colors:
- Primary Blue: #635BFF (used 1,247 times)
- Text: #0A2540 (dark blue-black)
- Accent Purple: #7A73FF
- Neutral Gray: #F6F9FC, #E3E8EE, #89A5C1

Spacing Scale:
- Base: 8px
- Scale: 8, 16, 24, 32, 48, 64, 96px
- Consistent gaps following 8px grid

Typography:
- Families: "Camphor", -apple-system, system-ui
- Sizes: 14px, 16px, 18px, 24px, 40px, 56px
- Weights: 400 (regular), 500 (medium), 600 (semibold)

Components Detected:
- PricingCard (3 variants)
- FeatureList
- ComparisonTable
- CTAButton (primary, secondary)
```

---

## Example 3: Analyze Tech Stack

**You:** Analyze the architecture of GitHub's pull request page

**Claude will:**
1. Use `farzi_analyze` on a GitHub PR URL
2. Parse the results
3. Explain the findings

**Response:**
```
GitHub Pull Request Page Analysis:

Framework: React (detected via imports and component patterns)

State Management:
- Type: Redux
- 12 stores detected:
  - pullRequest
  - diff
  - comments
  - reviews
  - checks
  - timeline
  - files
  - ...

JavaScript Modules:
- 156 modules total
- 89 React components
- Entry points: app.js, vendor.js

API Endpoints Captured:
- REST:
  - GET /api/repos/{owner}/{repo}/pulls/{number}
  - GET /api/repos/{owner}/{repo}/pulls/{number}/files
  - POST /api/repos/{owner}/{repo}/pulls/{number}/reviews
  - PATCH /api/repos/{owner}/{repo}/pulls/{number}

- GraphQL:
  - PullRequestQuery (fragments: PullRequestFragment, ReviewFragment)
  - UpdatePullRequestMutation

Behavior Patterns:
- 234 event listeners
- 45 click handlers on buttons
- Form submissions with CSRF tokens
- Infinite scroll on file diffs
- Real-time updates via polling

Design System:
- Primer design system detected
- 47 color tokens
- 16px base spacing
- Custom shadow system
```

---

## Example 4: Extract Single Component

**You:** Extract the pricing card from Stripe's homepage

**Claude will:**
1. Use `farzi_extract_component` with appropriate selector
2. Show the generated code

**Response:**
```typescript
// Component extracted from https://stripe.com

export interface PricingCardProps {
  title: string;
  price: string;
  features: string[];
  highlighted?: boolean;
  onSelect?: () => void;
}

export const PricingCard: React.FC<PricingCardProps> = ({
  title,
  price,
  features,
  highlighted = false,
  onSelect
}) => {
  return (
    <div
      className={cn(
        'rounded-lg border p-8 transition-shadow hover:shadow-lg',
        highlighted && 'border-primary-500 shadow-md'
      )}
    >
      <h3 className="text-2xl font-semibold mb-2">{title}</h3>
      <div className="mb-6">
        <span className="text-4xl font-bold">{price}</span>
        <span className="text-neutral-600">/month</span>
      </div>
      <ul className="space-y-3 mb-8">
        {features.map((feature, i) => (
          <li key={i} className="flex items-center gap-2">
            <CheckIcon className="text-primary-500" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>
      <button
        onClick={onSelect}
        className={cn(
          'w-full rounded-lg py-3 font-medium transition-colors',
          highlighted
            ? 'bg-primary-500 text-white hover:bg-primary-600'
            : 'bg-neutral-100 text-neutral-900 hover:bg-neutral-200'
        )}
      >
        Get Started
      </button>
    </div>
  );
};

// Design tokens extracted:
{
  "colors": {
    "primary": { "500": "#635BFF", "600": "#5851EA" },
    "neutral": {
      "100": "#F6F9FC",
      "600": "#89A5C1",
      "900": "#0A2540"
    }
  },
  "spacing": {
    "baseUnit": 8,
    "scale": [8, 16, 24, 32, 48, 64]
  }
}
```

---

## Example 5: Build Component Library

**You:** Extract all button variants from https://vercel.com and create a button component library

**Claude will:**
1. Use `farzi_extract_component` multiple times
2. Identify all button variants
3. Consolidate into a unified component

**Response:**
```typescript
// Consolidated Button component with all Vercel variants

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'outline'
  | 'ghost'
  | 'danger';

export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  loading?: boolean;
  disabled?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  children: React.ReactNode;
  onClick?: () => void;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  disabled = false,
  leftIcon,
  rightIcon,
  children,
  onClick
}) => {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2',
        'font-medium rounded-lg transition-all',
        'focus:outline-none focus:ring-2 focus:ring-offset-2',

        // Variants
        variant === 'primary' && [
          'bg-black text-white',
          'hover:bg-neutral-800',
          'focus:ring-black'
        ],
        variant === 'secondary' && [
          'bg-neutral-100 text-neutral-900',
          'hover:bg-neutral-200'
        ],
        variant === 'outline' && [
          'border border-neutral-300 bg-transparent',
          'hover:bg-neutral-50'
        ],
        variant === 'ghost' && [
          'bg-transparent hover:bg-neutral-100'
        ],
        variant === 'danger' && [
          'bg-red-500 text-white',
          'hover:bg-red-600'
        ],

        // Sizes
        size === 'sm' && 'px-3 py-1.5 text-sm',
        size === 'md' && 'px-4 py-2 text-base',
        size === 'lg' && 'px-6 py-3 text-lg',

        // States
        fullWidth && 'w-full',
        (disabled || loading) && 'opacity-50 cursor-not-allowed'
      )}
      onClick={onClick}
      disabled={disabled || loading}
    >
      {loading ? (
        <LoadingSpinner className="w-4 h-4" />
      ) : leftIcon}
      {children}
      {!loading && rightIcon}
    </button>
  );
};

// Found 5 variants across 23 button instances
// Extracted from: Homepage, Pricing, Dashboard, Templates
```

---

## Example 6: Migration Project

**You:** I need to migrate our Vue 2 app to React. Can you help me replicate the dashboard page?

**Claude will:**
1. Use `farzi_analyze` to understand the Vue structure
2. Use `farzi_replicate` with framework: 'react'
3. Explain the migration

**Response:**
```
I've analyzed your Vue 2 dashboard and replicated it in React.

Original (Vue 2):
- Vuex for state management
- Vue Router
- 12 single-file components

Generated (React):
- Redux Toolkit (similar to Vuex structure)
- React Router
- 12 TypeScript components
- Same design tokens preserved

Key conversions:
- Vue computed → useMemo hooks
- Vue watch → useEffect hooks
- Vuex modules → Redux slices
- Vue directives → React conditionals

The replica maintains:
✅ Exact same visual design (99.7% similarity)
✅ Same state management patterns
✅ Same API integration
✅ Same routing structure

Next steps:
1. cd ./react-dashboard
2. npm install
3. npm run dev
4. Test functionality
5. Gradually migrate remaining pages
```

---

## Example 7: Validation & Iteration

**You:** I've made some changes to my Linear clone. Can you validate it's still accurate?

**Claude will:**
1. Use `farzi_validate` comparing original to replica
2. Report differences
3. Suggest fixes if needed

**Response:**
```
Validation Results:

Visual Similarity: 97.3%
Target: 99.5%
Status: ❌ Below target

Differences found:
1. Color mismatch in sidebar (3,482 pixels)
   - Expected: #E3E4E8
   - Actual: #D3D4D8
   - Location: Left sidebar background

2. Spacing inconsistency (147 pixels)
   - Expected: 16px gap
   - Actual: 12px gap
   - Location: Issue card margins

3. Typography difference (892 pixels)
   - Expected: font-weight 500
   - Actual: font-weight 400
   - Location: Issue titles

Behavior Validation: ✅ Passed
- All click handlers working
- Form submissions functional
- API calls matching

Recommended fixes:
1. Update design-system/tokens/colors.ts:
   neutral.200: '#D3D4D8' → '#E3E4E8'

2. Update components/IssueCard.tsx:
   className: 'gap-3' → 'gap-4'

3. Update design-system/tokens/typography.ts:
   Add font-weight: 500 to heading styles

Would you like me to apply these fixes?
```

---

## Example 8: Competitive Analysis

**You:** Analyze how Notion implements their block editor

**Claude will:**
1. Use `farzi_analyze` on Notion
2. Deep dive into specific areas
3. Provide insights

**Response:**
```
Notion Block Editor Analysis:

Architecture:
- Custom React framework (not standard React)
- Highly optimized virtual scrolling
- Block-based data structure

State Management:
- Custom state system (not Redux/MobX)
- Operational Transform (OT) for real-time sync
- Local-first with sync queue

Key Patterns:
1. Block Component System
   - Each block is a React component
   - Uniform interface: render, serialize, transform
   - 47 block types detected

2. Selection System
   - Custom selection manager
   - Handles multi-block selection
   - Keyboard navigation state machine

3. Real-time Sync
   - WebSocket connection
   - OT algorithm for conflict resolution
   - Optimistic updates with rollback

4. Performance Optimizations
   - Virtual scrolling (only render visible blocks)
   - Memoization on block components
   - Debounced autosave (500ms)

Network Activity:
- POST /api/saveTransaction (OT operations)
- GET /api/loadUserContent (initial load)
- WebSocket: wss://notify.notion.so (real-time)

This is significantly more complex than standard CRUD apps.
Would you like me to replicate a simplified version?
```

---

## Tips for Best Results

### Be Specific
✅ "Clone the pricing page from stripe.com to ./stripe-pricing"
❌ "Clone Stripe"

### Provide Context
✅ "Extract the navbar from GitHub, I want to use it in my React app"
❌ "Get GitHub's navbar"

### Iterate
1. Start with analysis: "Analyze X"
2. Then replicate: "Now replicate it"
3. Then validate: "Check if it's accurate"
4. Then refine: "Fix the color differences"

### Use Validation
Always ask to validate replicas to catch subtle differences:
```
Clone X to Y, then validate it
```

### Ask Questions
Claude can explain what Farzi found:
```
What state management does Linear use?
How does Stripe structure their design tokens?
What API endpoints does GitHub's PR page call?
```

---

## Advanced Usage

### Combining Tools

**You:** Clone Vercel's homepage, but use their design tokens in a custom component

**Claude will:**
1. `farzi_extract_design` from Vercel
2. Create custom component using those tokens
3. Generate complete project with both

### Selective Extraction

**You:** I only want the color palette from Stripe, not the whole thing

**Claude will:**
1. `farzi_extract_design` from Stripe
2. Extract only colors from result
3. Present as minimal JSON

### Cross-Site Composability

**You:** Build a dashboard using Linear's sidebar, Stripe's pricing cards, and GitHub's file tree

**Claude will:**
1. Extract each component individually
2. Harmonize design tokens
3. Generate unified project

---

## Limitations to Know

**Dynamic Content:**
- User-specific data won't be captured
- You'll need to wire up your own API

**Authentication:**
- Can't capture logged-in views without credentials
- Use public pages or provide session cookies

**Client-Side Rendering:**
- Some SPAs need time to render
- Farzi waits for 'networkidle' but very slow sites may timeout

**Third-Party Scripts:**
- Analytics, ads, etc. may cause noise
- Validation might catch these as differences

**Not Magic:**
- Backend logic is not replicated
- Database schema is not generated
- Authentication systems need manual implementation

---

## Getting Help

If something doesn't work:

1. **Check the output:** Claude will show you what Farzi returned
2. **Try validation:** See what's different from expected
3. **Ask Claude:** "Why did this fail?" - Claude can read error messages
4. **Iterate:** "Try again with lower similarity target"

Issues: https://github.com/grandimam/farzi/issues
