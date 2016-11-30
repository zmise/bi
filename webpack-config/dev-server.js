// dev server，定义反向代理
const devServer = {
  historyApiFallback: true,
  hot: true,
  inline: true,
  stats: {
    colors: true
  },
  proxy: {
    '/bi/*': {
      target: 'http://172.16.72.38:8000/',
//      target: 'http://172.16.72.41:8081/',
//      target: 'http://172.16.72.32/',
      changeOrigin: true
      /*rewrite: function(req) {
        req.url = req.url.replace(/^\/api(.+)$/, '$1');
      }*/
    }
  }
};

module.exports = devServer;
