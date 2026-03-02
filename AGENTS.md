# AGENTS.md — Books API (Hono + Bun)

Guidance for agentic coding agents operating in this repository.

---

## Project Overview

REST API built with **Hono** on **Bun**, using **Prisma** (PostgreSQL) for persistence and **Zod** via `@hono/zod-openapi` for request/response validation and OpenAPI spec generation. No test framework — integration tests are run via Postman/Newman.

---

## Commands

```bash
# Install dependencies
bun install

# Run dev server (hot reload)
bun run dev           # → http://localhost:3000

# Run production
bun run start

# Type-check only (no emit)
bun run tsc

# Lint + format (Biome, auto-fix)
bun run check         # biome check --write

# Run API integration tests (requires running server + local_env.json)
bun run api-test      # npx newman run ./Books-API.postman_collection.json -e local_env.json

# Prisma: generate client (after schema changes)
bunx prisma generate --config prisma.config.ts

# Prisma: create/apply migrations
bunx prisma migrate dev --config prisma.config.ts
bunx prisma migrate deploy --config prisma.config.ts
```

> There is no unit test framework. "Tests" = Newman running the Postman collection against a live server.
> To test a single endpoint, run the server (`bun run dev`) and use the Postman collection or hit `/redoc` for the interactive API docs.

---

## Project Structure

```
src/
  index.ts              # App entry: OpenAPIHono setup, middleware, global error handler, server
  lib/
    prisma.ts           # Singleton PrismaClient (pg adapter)
    errorUtils.ts       # Shared OpenAPI error response schemas (zodError, httpError, serverError)
  books/
    dto.ts              # Zod schemas for request/response (DTOs)
    repository.ts       # Prisma queries — pure data access layer
    routes.ts           # OpenAPIHono route definitions + handlers
  genres/               # Same 3-file structure as books/
  reviews/              # Same 3-file structure as books/
  reset-db/             # Same 3-file structure as books/
prisma/
  schema.prisma         # Prisma schema (models: Book, Review, Genre, GenresOnBooks)
generated/
  prisma/               # Generated Prisma client (do NOT edit manually)
```

---

## Architecture Patterns

### Module structure (enforced per domain)
Every domain (`books`, `genres`, `reviews`, `reset-db`) MUST have exactly three files:
- `dto.ts` — Zod schemas only, no logic
- `repository.ts` — Prisma queries only, no HTTP concerns
- `routes.ts` — `OpenAPIHono` route definitions + inline handlers

### Route definitions
Use `createRoute()` from `@hono/zod-openapi` for every endpoint. Always declare:
- `method`, `path`
- `request.body` and/or `request.params` with Zod schemas
- `responses` using shared error helpers from `src/lib/errorUtils.ts`

```typescript
const getRoute = createRoute({
  method: 'get',
  path: '/{id}',
  request: {
    params: z.object({ id: z.cuid() }),
  },
  responses: {
    200: { description: 'Item', content: { 'application/json': { schema: getResponseDto } } },
    400: zodError,
    404: httpError,
    500: serverError,
  },
})
```

### Handlers
Handlers are inline inside the chained `.openapi()` calls on the module's `OpenAPIHono` instance:

```typescript
const router = new OpenAPIHono()
  .openapi(getRoute, async (c) => {
    const id = c.req.param('id')
    const item = await findById(id)
    if (!item) throw new HTTPException(404, { message: 'Not found' })
    return c.json(item)
  })
```

### Error handling
- Throw `HTTPException` from `hono/http-exception` for 4xx errors (404, etc.)
- Do NOT wrap handlers in try/catch — the global `app.onError` in `index.ts` catches all Prisma and HTTP errors
- Response shapes: `{ name, message }` for HTTP/Prisma errors; Zod errors are handled automatically

---

## Code Style

### Formatter / Linter — Biome
- **Indent**: spaces (default: 2)
- **Semicolons**: `asNeeded` — omit semicolons wherever possible
- **Quote style**: single quotes for JS/TS strings
- **Import organization**: auto-sorted by Biome `organizeImports` (run `bun run check` to apply)
- `dist/` and `generated/` are excluded from linting

### TypeScript
- `strict: true` — no implicit `any`, strict null checks, etc.
- Module resolution: `bundler` (Bun-native)
- Target: `ES2023`
- **Never** use `as any`, `@ts-ignore`, or `@ts-expect-error` — the only exception is `errorUtils.ts` which uses `as any` for a known OpenAPI type limitation (marked with `biome-ignore`)
- Always use `import type { ... }` for type-only imports

### Naming conventions
- **Files**: camelCase (`errorUtils.ts`, `routes.ts`)
- **Variables/functions**: camelCase
- **Zod schemas (DTOs)**: camelCase suffixed with `Dto` — e.g. `createBookRequestDto`, `listBooksResponseDto`
- **Route objects**: camelCase suffixed with `Route` — e.g. `getListRoute`, `patchRoute`
- **Repository functions**: verb + noun — `findAllBooks`, `createBook`, `removeBook`, `updateBook`
- **Prisma models**: PascalCase (follow Prisma conventions)
- IDs use `z.cuid()` — always validate with `z.cuid()`, not `z.string()`

### Imports order (enforced by Biome)
1. External packages
2. Internal paths (relative `../` then `./`)
3. `import type` separated from value imports

### Zod / DTOs
- All schemas in `dto.ts`, exported as named constants
- Always call `.strict()` on object schemas to reject unknown fields
- Use `z.coerce.date()` for date inputs from JSON bodies
- `price` is a Prisma `Decimal` — serializes to `string` in JSON; DTOs reflect this (`z.string()`)

### Prisma
- Client singleton in `src/lib/prisma.ts` — import as `import prisma from '../lib/prisma'`
- Generated client lives in `generated/prisma/` — import from there, not from `@prisma/client`
- Use `import type { ... }` from `generated/prisma/client` and `generated/prisma/models` for Prisma types
- Always use `{ where: { id } }` pattern in repository functions

---

## Environment

```bash
DATABASE_URL=<postgresql connection string>
PORT=3000  # optional, default 3000
```

Copy `.env.template` to `.env` to get started.

---

## OpenAPI / Docs

- OpenAPI spec: `GET /doc`
- ReDoc UI: `GET /redoc`
- Spec generated automatically from `createRoute()` definitions — keep route schemas accurate
