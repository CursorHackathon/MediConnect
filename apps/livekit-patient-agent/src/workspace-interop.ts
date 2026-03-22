/**
 * When `tsx` runs a file entry (e.g. `src/main.ts`), workspace packages that point at `.ts`
 * sources are sometimes loaded as a synthetic `{ default: realExports }` shape. Named imports
 * like `import { prisma } from "@mediconnect/db"` then fail at runtime.
 */
export function unwrapDefaultModule<T extends Record<string, unknown>>(mod: T): T {
  const keys = Object.keys(mod);
  if (keys.length === 1 && keys[0] === "default") {
    const inner = (mod as unknown as { default: unknown }).default;
    if (inner && typeof inner === "object") {
      return inner as T;
    }
  }
  return mod;
}
