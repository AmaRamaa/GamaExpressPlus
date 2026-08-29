/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      // Product photos are actually served from Supabase Storage (see
      // backend/src/routes/uploads.ts) -- this is what lets next/image
      // request them.
      { protocol: "https", hostname: "odskekxcabzbfpyqkmkh.supabase.co" },
    ],
  },
  reactStrictMode: true,
};

module.exports = nextConfig;
