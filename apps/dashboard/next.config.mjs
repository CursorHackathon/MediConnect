/** @type {import('next').NextConfig} */
const nextConfig = {
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
