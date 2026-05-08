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
      },
      max_memory_restart: "512M",
      time: true,
    },
  ],
};
