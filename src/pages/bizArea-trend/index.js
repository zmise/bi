var common = require('common');
var coala = require('coala');
require('assets/css/ranking.css');

var content = require('./content');

var tpl = require('./index.html');

coala.mount($.extend(true, common, {
  tpl: tpl,
  refs: {
    content: {
      component: content,
      el: '#pageWrapper'
    }
  }
}), '#app');
