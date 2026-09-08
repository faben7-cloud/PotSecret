/** @type {import("next").NextConfig} */
const nextConfig = {
  // Keep /_next/data URLs recognizable so i18n never rewrites framework requests.
  skipMiddlewareUrlNormalize: true
};

export default nextConfig;
