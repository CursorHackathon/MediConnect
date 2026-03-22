import { config as loadEnv } from "dotenv";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
// Monorepo root `.env` is not auto-loaded by Next.js (only `apps/web/.env*`).
loadEnv({ path: resolve(__dirname, "../../.env"), quiet: true });
loadEnv({ path: resolve(__dirname, ".env.local"), quiet: true });

/** Standalone output uses symlinks; enable only in Linux/Docker (`DOCKER_NEXT_STANDALONE=1`) to avoid Windows EPERM. */
const standaloneDocker =
  process.env.DOCKER_NEXT_STANDALONE === "1"
    ? {
        output: "standalone",
        experimental: { outputFileTracingRoot: join(__dirname, "../..") },
      }
    : {};

/** @type {import('next').NextConfig} */
const nextConfig = {
  ...standaloneDocker,
  experimental: {
    ...(standaloneDocker.experimental || {}),
    serverComponentsExternalPackages: ["@prisma/client"],
  },
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
