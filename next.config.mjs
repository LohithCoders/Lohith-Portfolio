/** @type {import('next').NextConfig} */
const nextConfig = { output: 'standalone', distDir: process.env.NEXT_DIST_DIR || '.next-build', poweredByHeader: false, experimental: {cpus: 1} };
export default nextConfig;
