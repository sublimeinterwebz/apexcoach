const withPWA = require("next-pwa")({
  dest: "public",
  disable: true, // Disabled — service worker was causing stale cache / slow loads
  register: false,
  skipWaiting: true,
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
};

module.exports = withPWA(nextConfig);
