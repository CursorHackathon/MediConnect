/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    "@mediconnect/ui",
    "@mediconnect/types",
    "@mediconnect/auth",
    "@mediconnect/db",
  ],
};

export default nextConfig;
