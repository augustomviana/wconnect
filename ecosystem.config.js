module.exports = {
  apps: [
    {
      name: "whatsapp-backend",
      script: "./dist/server.js",
      cwd: "./backend",
      exec_mode: "fork",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
        PORT: 5000,
        DB_HOST: "localhost",
        DB_PORT: 5432,
        DB_USER: "whatsapp_user",
        DB_PASSWORD: "romanos1",
        DB_NAME: "whatsapp_db",
        JWT_SECRET: "b4d2f8e1a6c0c2e3f5a7b9d8c0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9",
        FRONTEND_URL: "https://wconnect.repagil.com.br",
      },
      error_file: "../logs/backend-error.log",
      out_file: "../logs/backend-out.log",
      log_file: "../logs/backend-combined.log",
    },
    {
      name: "whatsapp-frontend",
      script: "npm",
      args: "start",
      cwd: "./frontend",
      exec_mode: "fork",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      error_file: "../logs/frontend-error.log",
      out_file: "../logs/frontend-out.log",
      log_file: "../logs/frontend-combined.log",
    },
  ],
};
