module.exports = {
  chainWebpack: (config) => {
    config.plugin('html').tap((args) => {
      args[0].title = 'Lumino'
      return args
    })
  },
  devServer: {
    proxy: {
      '/right-api': {
        target: 'http://10.10.8.177:8080/', // 要访问的接口域名
        changeOrigin: true,
        pathRewrite: {
          '^/right-api': '/api'
        }
      },
      '/api': {
        target: 'http://10.10.8.176:8080/', // 要访问的接口域名
        changeOrigin: true,
        pathRewrite: {
          '^/api': '/api'
        }
      }
    }
  }
}
