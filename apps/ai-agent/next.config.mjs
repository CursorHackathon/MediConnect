/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    "@mediconnect/ui",
    "@mediconnect/types",
    "@mediconnect/api-client",
    "@mediconnect/knowledge-base",
  ],
};

export default nextConfig;
