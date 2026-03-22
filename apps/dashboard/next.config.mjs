import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const standaloneDocker =
  process.env.DOCKER_NEXT_STANDALONE === "1"
    ? {
        output: "standalone",
        experimental: { outputFileTracingRoot: path.join(__dirname, "../..") },
      }
    : {};

/** @type {import('next').NextConfig} */
const nextConfig = {
  ...standaloneDocker,
  experimental: {
    ...(standaloneDocker.experimental || {}),
    // Avoid bundling Prisma so DATABASE_URL is not inlined from the Docker build stage (127.0.0.1).
    serverComponentsExternalPackages: ["@prisma/client"],
  },
  transpilePackages: [
    "@mediconnect/ui",
    "@mediconnect/types",
    "@mediconnect/api-client",
    "@mediconnect/auth",
    "@mediconnect/db",
    "@mediconnect/knowledge-base",
    "@mediconnect/i18n",
  ],
};

export default nextConfig;
