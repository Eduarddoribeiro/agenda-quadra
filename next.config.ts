import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  // Só no `next dev`: permite abrir por 127.0.0.1 além de localhost.
  allowedDevOrigins: ["127.0.0.1"],
  turbopack: {
    // Há um package-lock.json solto na pasta do usuário; a raiz do projeto é esta.
    root: process.cwd(),
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
