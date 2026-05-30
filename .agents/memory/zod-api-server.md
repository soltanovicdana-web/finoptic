---
name: Zod in api-server
description: How to import and use zod in the api-server package
---

Zod must be a direct dependency of `@workspace/api-server` — it is not automatically available from `@workspace/api-zod` (which only re-exports generated schemas, not the `z` object).

**Rule:** Add `"zod": "catalog:"` to `artifacts/api-server/package.json` dependencies, then import as `import { z } from "zod"`.

**Why:** The workspace catalog pins zod at `^3.25.76` (v3). The `zod/v4` subpath import looks correct syntactically but TypeScript cannot resolve it without an explicit dep entry; even then `zod/v4` is a v3 compat shim and importing from `"zod"` directly is simpler and reliable.

**How to apply:** Any new route or lib file in `api-server` that needs runtime validation should use `import { z } from "zod"` — not `"zod/v4"`, not `@workspace/api-zod`.
