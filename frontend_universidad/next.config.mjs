/** @type {import('next').NextConfig} */
const nextConfig = { 
  
  // 2. OBLIGATORIO: Desactiva la optimización de imágenes (Electron no la soporta en local)
  images: {
    unoptimized: true,
  },

  // 3. RECOMENDADO: Asegura que las rutas internas funcionen en el sistema de archivos
  trailingSlash: true,

  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
