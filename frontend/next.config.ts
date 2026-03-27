import type { NextConfig } from "next";

import path from "path";

const nextConfig: NextConfig = {
  transpilePackages: ['@tensorflow-models/face-landmarks-detection'],
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "@mediapipe/face_mesh": path.resolve(__dirname, "lib/mock-mediapipe.ts"),
    };
    return config;
  },
  experimental: {
    // @ts-ignore
    turbo: {
      resolveAlias: {
        "@mediapipe/face_mesh": "./lib/mock-mediapipe.ts",
      },
    },
  },
};

export default nextConfig;
