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
