import { config as loadEnv } from "dotenv";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
loadEnv({ path: resolve(__dirname, "../../.env"), quiet: true });
loadEnv({ path: resolve(__dirname, ".env.local"), quiet: true });

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
  transpilePackages: [
    "@mediconnect/ui",
    "@mediconnect/types",
    "@mediconnect/auth",
    "@mediconnect/db",
    "@mediconnect/knowledge-base",
  ],
};

export default nextConfig;
