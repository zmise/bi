// dev server，定义反向代理
const devServer = {
  historyApiFallback: true,
  hot: true,
  inline: true,
  stats: {
    colors: true
  },
  headers: {
    "set-cookie": 'JSESSIONID=7912DC1BA0616AC160830C8E2B95746E'
  },
  proxy: {
    '/bi/*': {
      // target: 'http://172.16.72.46:8889/',
      target: 'http://172.16.72.97:8000/',
      // target: 'http://192.168.0.195:8201/',
      // target: 'http://172.16.72.7:8888/',
      changeOrigin: true
      /*rewrite: function(req) {
        req.url = req.url.replace(/^\/api(.+)$/, '$1');
      }*/
    },
    '/asyncData/*': {
      target: 'http://www.treejs.cn/v3/demo/cn/',
      // target: 'http://172.16.72.2:8080/',
      // target: 'http://10.251.92.179:80/',
      changeOrigin: true
    }
  }
};

module.exports = devServer;
