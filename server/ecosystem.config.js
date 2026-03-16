module.exports = {
  apps: [
    {
      name: "aura-server",
      script: "dist/src/server.js",
      cwd: "/home/node57/Aura/server",
      instances: 1,
      exec_mode: "fork",
      env_production: {
        NODE_ENV: "production",
      },
    },
  ],
};
