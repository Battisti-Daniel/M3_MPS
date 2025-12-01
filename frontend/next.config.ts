import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Otimizações de performance
  reactStrictMode: true,
  
  // Garantir que date-fns e recharts sejam transpilados corretamente
  transpilePackages: ['date-fns', 'recharts'],
  
  // Otimizações experimentais
  experimental: {
    // Otimiza os imports de pacotes grandes
    optimizePackageImports: ['lucide-react', 'date-fns', 'recharts'],
  },
  
  // Compressão de assets
  compress: true,
  
  // Otimizar imagens
  images: {
    formats: ['image/avif', 'image/webp'],
  },
  
  // Desabilitar source maps em produção para builds mais rápidos
  productionBrowserSourceMaps: false,
  
  // Otimizar chunks
  modularizeImports: {
    'lucide-react': {
      transform: 'lucide-react/dist/esm/icons/{{kebabCase member}}',
    },
  },
};

export default nextConfig;
