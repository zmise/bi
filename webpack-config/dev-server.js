// dev server，定义反向代理
const devServer = {
  historyApiFallback: true,
  hot: true,
  inline: true,
  stats: {
    colors: true
  },
  headers:{
    "set-cookie":'JSESSIONID=0FE58D5F5CCC378672584EA7DDDA5A99'
  },
  proxy: {
    '/bi/*': {
       target: 'http://172.16.72.14:8000/',
      // target: 'http://172.16.72.2:8080/',
     // target: 'http://10.251.92.179:80/',
      changeOrigin: true
      /*rewrite: function(req) {
        req.url = req.url.replace(/^\/api(.+)$/, '$1');
      }*/
    }
  }
};

module.exports = devServer;
