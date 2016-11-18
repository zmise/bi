var config = require('config');
var coala = require('coala');
var invalidSession = false;

require('vendors/qui/css/bootstrap.min.css');
require('assets/css/base.css');

require('vendors/qui/js/bootstrap');

// setup the default parameter for all of the ajax requests
$.ajaxSetup({
  cache: false,
  xhrFields: {
    withCredentials: true
  }
});

