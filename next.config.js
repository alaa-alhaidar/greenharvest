/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      {
        source: '/admin',
        destination: '/api/admin-panel',
        permanent: false,
      },
    ];
  },
};

module.exports = nextConfig;
