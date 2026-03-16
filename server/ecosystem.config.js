module.exports = {
  apps: [
    {
      name: "aura-server",
      script: "dist/src/server.js",
      cwd: "/home/node57/Aura/server",
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
