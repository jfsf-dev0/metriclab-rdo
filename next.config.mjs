/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'keadkoqnvabhyxbrfjax.supabase.co',
      },
    ],
  },
};

export default nextConfig;
