const { defineConfig } = require('@vue/cli-service')
module.exports = defineConfig({
  transpileDependencies: true,
  devServer: {
    https: true,
    port: 8080,
    host: '0.0.0.0',
    allowedHosts: 'all',
    client: {
      webSocketURL: {
        hostname: 'localhost',
        pathname: '/ws',
        port: 8080,
        protocol: 'wss',
      },
    },
  }
})
