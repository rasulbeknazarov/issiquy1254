/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Google OAuth profile photos
    remotePatterns: [{ protocol: "https", hostname: "lh3.googleusercontent.com" }],
  },
};

module.exports = nextConfig;
