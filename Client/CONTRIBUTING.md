# Contributing Guide

## CSS Approach

This project uses **co-located plain CSS files** — not CSS Modules, Tailwind, or styled-components.

### Rules

- Each page or component owns a `.css` file placed in the **same directory** as the `.tsx` file.
  ```
  src/app/admin/campaigns/
    page.tsx
    campaigns.css       ← co-located
  ```
- Import the CSS file directly at the top of the component:
  ```ts
  import "./campaigns.css";
  ```
- Class names are **global**. Use specific, descriptive names (e.g. `.acTable`, `.apBadge`) to avoid collisions. Prefix classes with a short component abbreviation where the scope is unclear.
- Do **not** introduce CSS Modules (`.module.css`), Tailwind utility classes, or CSS-in-JS without team agreement.

## TypeScript

- Shared API response types live in `src/types/`.  Import from there instead of using `any`.
  - `campaign.types.ts` — fundraiser / campaign DTOs
  - `payout.types.ts` — payout / withdrawal DTOs
  - `api.generated.d.ts` — auto-generated from the server's OpenAPI spec (do not edit manually)
- Avoid `any`. Prefer `unknown` in catch clauses and narrow the type before use.

### Regenerating API types from the OpenAPI spec

When the server adds or changes an endpoint, regenerate the client types:

```bash
# 1. In Server/ — export the spec to Client/openapi.json
npm run generate:openapi

# 2. In Client/ — regenerate TypeScript types from the spec
npm run generate:types
```

The generated file `src/types/api.generated.d.ts` is committed to the repo so CI does not need the server running.  Do **not** edit it manually — re-run the generation instead.

## Component Structure

- Large pages should be split into focused sub-components under a `_components/` directory.
- Lazy-load sub-components with `React.lazy` + `<Suspense>` where they are below the fold.

## Logging

- Use `src/lib/logger.ts` instead of raw `console.*` calls.
  ```ts
  import { logger } from "@/lib/logger";
  logger.error("Payment failed", err);
  ```
- `console.log` and `console.warn` are flagged by ESLint. Only `console.error` is allowed for unrecoverable issues, but prefer `logger.error` so errors are forwarded to Sentry.
