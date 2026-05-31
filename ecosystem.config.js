module.exports = {
  apps : [{
    name: 'e-pro-support',
    script: 'server.js',

    // Options reference: https://pm2.io/doc/en/runtime/reference/ecosystem-file/
    // args: 'one two',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'development',
      TZ: 'Asia/Bangkok'
    },
    env_production: {
      NODE_ENV: 'production',
      TZ: 'Asia/Bangkok'
    }
  }]
}

