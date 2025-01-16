import { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // React strict mode ensures potential issues are highlighted
  reactStrictMode: true,

  // Enables SWC minifier for better build performance
  swcMinify: true,

  // Environment variables
  env: {
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL, // Ensure this is set in your `.env` file
  },

  // Custom Webpack configurations (if required)
  webpack(config) {
    // Example: Adjust Webpack config if needed
    return config;
  },

  // API endpoint configurations (if any special setup is required)
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: '/api/:path*',
      },
    ];
  },

  // Image optimization for domains
  images: {
    domains: ['lh3.googleusercontent.com'], // Example: Add domains for image providers
  },
};

export default nextConfig;
