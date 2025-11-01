import type { NextConfig } from "next";
import type { RuleSetRule } from "webpack";

const nextConfig: NextConfig = {
  webpack(config) {
    // Remove default SVG handling
    config.module.rules = (config.module.rules as RuleSetRule[]).map((rule) => {
      if (rule.test instanceof RegExp && rule.test.test(".svg")) {
        return { ...rule, exclude: /\.svg$/i };
      }
      return rule;
    });

    // Add SVGR loader
    config.module.rules.push({
      test: /\.svg$/i,
      issuer: /\.[jt]sx?$/,
      use: [
        {
          loader: "@svgr/webpack",
          options: {
            icon: true,
          },
        },
      ],
    });

    return config;
  },
};

export default nextConfig;
