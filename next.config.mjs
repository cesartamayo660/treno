/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Exportación estática: `npm run build` deja la app lista en /out
  // y el script scripts/publicar-index.mjs copia el index.html a la raíz.
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
};

export default nextConfig;
