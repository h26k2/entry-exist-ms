// Production process manager for Node.js
module.exports = {
  apps: [
    {
      name: "entry-exist-ms-server",
      script: "server.js",
      instances: "max",
      exec_mode: "cluster",
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
