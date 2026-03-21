/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    "@mediconnect/ui",
    "@mediconnect/types",
    "@mediconnect/auth",
    "@mediconnect/db",
    "@mediconnect/i18n",
  ],
};

export default nextConfig;
