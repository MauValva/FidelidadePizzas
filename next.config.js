/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  turbopack: {
    // Mantém o projeto como raiz da compilação mesmo com outro package-lock acima dele.
    root: __dirname,
  },
};

module.exports = nextConfig;
