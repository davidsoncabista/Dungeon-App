import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      // Firebase Storage (essencial)
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
      },
      // Placeholders
      {
        protocol: 'https',
        hostname: 'placehold.co',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
      },
      // Bancos de Imagens Gratuitas
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'images.pexels.com',
      },
      {
        protocol: 'https',
        hostname: 'cdn.pixabay.com',
      },
      // Freepik e ecossistema
      {
        protocol: 'https',
        hostname: '**.freepik.com',
      },
      {
        protocol: 'https',
        hostname: '**.flaticon.com',
      },
      {
        protocol: 'https',
        hostname: 'api.storyset.com',
      },
      // Bancos de Imagens Premium
      {
        protocol: 'https',
        hostname: 'as1.ftcdn.net', // Adobe Stock
      },
      {
        protocol: 'https',
        hostname: 'media.gettyimages.com', // Getty Images
      },
      {
        protocol: 'https',
        hostname: 'image.shutterstock.com', // Shutterstock
      },
      // Ícones
      {
        protocol: 'https',
        hostname: 'static.thenounproject.com', // The Noun Project
      },
      {
        protocol: 'https',
        hostname: 'fonts.gstatic.com', // Google Fonts (Material Icons)
      },
      // GIFs
      {
        protocol: 'https',
        hostname: 'media*.giphy.com',
      },
      // Hospedagem Genérica
      {
        protocol: 'https',
        hostname: 'i.imgur.com',
      },
    ],
  },
};

export default nextConfig;
