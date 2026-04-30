import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "cdn.sanity.io" },
    ],
  },
  async redirects() {
    return [
      { source: "/pages/parcours/:path*", destination: "/parcours", permanent: true },
      { source: "/pages/regards-d-apres/:path*", destination: "/regards", permanent: true },
      { source: "/pages/agent/:path*", destination: "/agent", permanent: true },
      { source: "/livredor", destination: "/contact", permanent: true },
    ];
  },
};

export default nextConfig;
