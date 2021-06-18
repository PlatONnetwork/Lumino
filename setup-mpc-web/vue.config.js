module.exports = {
  devServer: {
    proxy: {
      '/api': {
        target: 'http://172.222.222.74', // 要访问的接口域名
        changeOrigin: true,
        pathRewrite: {
          '^/api': '/api'
        }
      }
    }
  }
}
