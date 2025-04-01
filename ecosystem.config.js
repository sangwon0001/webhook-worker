module.exports = {
  apps: [{
    name: 'webhook-worker',
    script: 'src/index.js',
    watch: false,
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    error_file: './logs/webhook-worker-error.log',
    out_file: './logs/webhook-worker-output.log'
  }]
};
