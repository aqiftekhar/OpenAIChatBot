import fs from 'fs';

const nextConfig = {
  env: {
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      console.log('Available API routes:');
      const apiDir = './app/api';
      fs.readdirSync(apiDir).forEach(file => {
        const route = file.replace(/\.ts$/, '');
        console.log(`- /api/${route}`);
      });
    }
    return config;
  },
};

export default nextConfig;
