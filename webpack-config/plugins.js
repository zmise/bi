const path = require('path');
const config = require('./config');
const pages = require('./pages');

const webpack = require('webpack');
const HappyPack = require('happypack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

const happyThreadPool = HappyPack.ThreadPool({ size: 10 });

function createHPPlugin(id, loaders) {
  return new HappyPack({
    id: id,
    loaders: loaders,
    threadPool: happyThreadPool,

    // make happy more verbose with HAPPY_VERBOSE=1
    verbose: process.env.HAPPY_VERBOSE === '1'
  });
}

// 定义 plugin
const plugins = [
  // 全局 jquery
  new webpack.ProvidePlugin({
    $: 'jquery',
    jQuery: 'jquery',
    'window.jQuery': 'jquery',
    'window.$': 'jquery'
  }),
  new webpack.optimize.CommonsChunkPlugin({
    name: ['common','echarts'],
    filename: 'js/[name]-[hash:8].js',
    minChunks: 3
  }),
/*
  new CopyWebpackPlugin([
    { from: path.resolve(config.srcDir, 'assets/vendors/respond.min.js'), to: 'js/' }
  ]),
*/

  createHPPlugin('html', ['dot']),
  createHPPlugin('css', ['css?minimize&-autoprefixer']),
  //createHPPlugin('image', ['file?name=static/img/[name].[ext]']),

  // createHPPlugin('font-ttf', ['file?minetype=application/octet-stream&name=static/fonts/[name].[ext]']),
  // createHPPlugin('font-eot', ['file?name=static/fonts/[name].[ext]']),
  // createHPPlugin('font-svg', ['file?minetype=image/svg+xml&name=static/fonts/[name].[ext]']),
  // createHPPlugin('font-woff', ['file?minetype=application/font-woff&name=static/fonts/[name].[ext]']),
  // createHPPlugin('font-woff2', ['file?minetype=application/font-woff&name=static/fonts/[name].[ext]']),

  new ExtractTextPlugin('css/[name]-[chunkhash:8].css', {allChunks: true})

];

// 自动生成 html 页面，并注入 css & js
pages.forEach(function(page) {
  const htmlPlugin = new HtmlWebpackPlugin({
    filename: page + '.html',
    template: path.resolve(config.srcDir, 'template.html'),
    chunks: [page, 'common' , 'echarts'],
    minify: {
      removeComments: true,
      collapseWhitespace: true
    }
  });
  plugins.push(htmlPlugin);
});

module.exports = plugins;
