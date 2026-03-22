import { config as loadEnv } from "dotenv";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
// Monorepo root `.env` is not auto-loaded by Next.js (only `apps/web/.env*`).
loadEnv({ path: resolve(__dirname, "../../.env"), quiet: true });
loadEnv({ path: resolve(__dirname, ".env.local"), quiet: true });

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    "@mediconnect/ui",
    "@mediconnect/types",
    "@mediconnect/auth",
    "@mediconnect/api-client",
    "@mediconnect/knowledge-base",
    "@mediconnect/db",
  ],
};

export default nextConfig;
