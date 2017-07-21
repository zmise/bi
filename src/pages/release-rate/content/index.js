var coala = require('coala');
var config = require('config');
var tpl = require('./index.html');
var topForm = require('components/top-form');
var pageTpl = require('./pages.html');
var summaryTpl = require('./summary.html');
require('./index.css');

module.exports = {
  tpl: tpl,
  refs: {
    topForm: {
      component: topForm,
      el: '#topForm'
    }
  },
  listen: {
    init: function () {
      this.config = {
        pageSize: 30,
        currentPage: 1
      };
    },
    mount: function () {
      var _this = this;
      this.refs.topForm.trigger('setQuerycall', function (opt) {
        _this.config.currentPage = 1;
        _this.list.load($.extend({}, opt, {
          pageIndex: _this.config.currentPage,
          sizePerPage: _this.config.pageSize
        }));
        _this.trigger('tablepage', []);

        var height = $(window).height() - $('#topForm').height()  - 145;
        if($('.mmg-bodyWrapper').height() !== height){
          $('.mmg-bodyWrapper').height(height);
        }
      });
      this.trigger('renderTable');
      // 设置导出地址
      this.$('#export').attr('to-url','/bi/marketing/housePublishRate/orgHousePublishRateStat.excel?').removeAttr('disabled');
    },
    renderTable: function () {
      var _this = this;
      this.list = this.$('#list').table({
        cols: [{
          title: '名称',
          name: 'entityName',
          align: 'center',
          width: 200
        }, {
          //   title: '统计日期',
          //   name: 'checkMonthYM',
          //   align: 'center',
          //   width: 80,
          //   lockWidth: true
          // }, {
          title: '有效房源',
          name: 'houseCount',
          align: 'center',
          width: 120,
          lockWidth: true
        }, {
          title: '可发房源',
          name: 'houseCanPublishCount',
          align: 'center',
          width: 120,
          lockWidth: true
        }, {
          title: '已发房源',
          name: 'housePublishedCount',
          align: 'center',
          width: 140,
          lockWidth: true
        }, {
          title: '发布率',
          name: 'housePublishRate',
          align: 'center',
          width: 120,
          lockWidth: true,
          renderer: function (val, item, rowIndex) {
            return _this.formatValue(val) + '%';
          }
        }],
        autoLoad: false,
        height: 'auto',
        method: 'get',
        url: '/bi/marketing/housePublishRate/orgHousePublishRatePagingStat.json',
        indexCol: true,
        noDataText: '',
        fullWidthRows:true,
        indexColWidth: 60,
        showBackboard: false,
        transform: function (res) {
          var data = res.data.parallelList[0];
          if (!data) {
            data = {};
            data.entityName = _this.refs.topForm.params.name;
          }
          data.date = $('#selectedDate').data('datepicker').el.value;
          data.housePublishRate = _this.formatValue(data.housePublishRate);
          $('#summary').html(summaryTpl(data));
          _this.config.pageCount = Math.ceil(res.data.subListTotal / _this.config.pageSize) || 1;
          _this.config.total = res.data.subListTotal;
          _this.trigger('tablepage', $.extend({}, _this.config));
          return res.data.subList;
        }
      }).on('loadSuccess', function (e, data) {
        var $grid = $(this).closest('.mmGrid');
        $grid.removeClass('table-no-data');
        $grid.find('th').eq(0).find('.mmg-title').text('排名');
        !data && $grid.addClass('table-no-data');
      });
    },
    tablepage: function (data) {
      data.currentPage = this.config.currentPage;
      $('#tablepage').html(pageTpl(data)).show();
    }
  },
  events: {
    'click .pagebox a': 'sendpage'
  },
  handle: {
    sendpage: function (e) {
      var action = $(e.currentTarget).data('action');
      var currentPage = this.config.currentPage;
      var pageCount = this.config.pageCount;
      if (pageCount === 1) {
        return false;
      }

      if (currentPage !== 1 && action === 'first') {
        this.config.currentPage = currentPage = 1;
      } else if (currentPage !== 1 && action === 'prev') {
        this.config.currentPage = --currentPage;
      } else if (currentPage !== pageCount && action === 'next') {
        this.config.currentPage = ++currentPage;
      } else if (currentPage !== pageCount && action === 'last') {
        this.config.currentPage = currentPage = pageCount;
      } else {
        return false;
      }

      this.list.load($.extend({}, this.refs.topForm.getParams(), {
        pageIndex: this.config.currentPage,
        sizePerPage: this.config.pageSize
      }));
    }
  },
  mixins: [{
    formatValue: function (val) {
      val += '';
      var index = val.indexOf('.');
      if (index > -1 && val.length > index + 3) {
        val = (+val).toFixed(2);
      }
      return +val;
    }
  }]
};