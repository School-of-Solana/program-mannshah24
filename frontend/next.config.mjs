/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config, { isServer }) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
      crypto: false,
    };
    
    // Ignore pino-pretty warnings
    if (!isServer) {
      config.ignoreWarnings = [
        { module: /node_modules\/pino/ },
      ];
    }
    
    return config;
  },
};

export default nextConfig;
