/** @type {import('next').NextConfig} */
const isGitHubPages = process.env.GITHUB_PAGES === 'true';
const nextConfig = {
  output: isGitHubPages ? 'export' : 'standalone',
  distDir: isGitHubPages ? '.next' : (process.env.NEXT_DIST_DIR || '.next-build'),
  ...(isGitHubPages ? {basePath: '/Lohith-Portfolio', trailingSlash: true} : {}),
  poweredByHeader: false,
  experimental: {cpus: 1},
};
export default nextConfig;
