const withAnalyzer = require("@next/bundle-analyzer")({
  enabled:
    process.env.ANALYZE === "true" && process.env.NODE_ENV !== "development",
});
const { withSuperjson } = require("next-superjson");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  experimental: {
    images: {
      allowFutureImage: true,
    },
  },
  images: {
    domains: ["lh3.googleusercontent.com", "platform-lookaside.fbsbx.com", "tu2k22-memoryapp-public.s3.amazonaws.com"],
    remotePatterns:[{
      protocol: "https",
      hostname: "tu2k22-memoryapp-public.s3.amazonaws.com",
      port:'',
      pathname:"/*"
    }],
    minimumCacheTTL: 9999999,
  },
};

module.exports = withSuperjson()(withAnalyzer(nextConfig));
