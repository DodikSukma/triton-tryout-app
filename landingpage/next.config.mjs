/** @type {import('next').NextConfig} */
const nextConfig = {
  // Marketing site — statically generated for fast first paint and SEO.
  reactStrictMode: true,
  images: {
    // Placeholder imagery for the marketing landing page (Bimbel Triton).
    // placehold.co serves SVG by default, so SVG handling must be allowed.
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    remotePatterns: [
      { protocol: 'https', hostname: 'placehold.co' },
    ],
  },
}

export default nextConfig
