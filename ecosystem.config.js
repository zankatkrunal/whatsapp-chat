module.exports = {
  apps: [
    {
      name: 'chatconnect',
      script: './server/server.js',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'development',
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 5000,
      },
      log_date_format: 'YYYY-MM-DD HH:mm Z',
      error_file: './logs/server-err.log',
      out_file: './logs/server-out.log',
      merge_logs: true,
    },
  ],
};
