/** @type {import('next').NextConfig} */
const nextConfig = {
  // TRN-24: the public marketing site now lives in the standalone `landingpage`
  // app. This app serves only the authenticated dashboards + exam engine.
  reactStrictMode: true,
}

export default nextConfig
