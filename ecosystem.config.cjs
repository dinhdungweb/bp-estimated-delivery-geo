module.exports = {
  apps: [
    {
      name: "bp-estimated-delivery-geo",
      script: "npm",
      args: "run start",
      cwd: __dirname,
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
        PORT: "3002",
        SHOPIFY_APP_URL: "https://estimated-delivery.bluepeaks.top",
        SHOPIFY_ADMIN_APP_HANDLE: "bp-estimated-delivery-geo-2",
      },
      max_memory_restart: "512M",
      time: true,
    },
  ],
};
