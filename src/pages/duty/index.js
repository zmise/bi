var coala = require('coala');
var common = require('common');

var content = require('./content');

var tpl = require('./index.html');
require('assets/css/behavior.css');

coala.mount($.extend(true, common, {
  tpl: tpl,
  refs: {
    content: {
      component: content,
      el: '#pageWrapper'
    }
  }
}), '#app');
