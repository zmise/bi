var coala = require('coala');
var config = require('config');
var tpl = require('./index.html');
require('./index.css');

module.exports = {
  tpl: tpl,
  listen: {
    mount: function() {
      this.trigger('renderTabsList');
      this.trigger('renderTable');
    },
    renderTabsList: function() {
      var len = 12;
      var now = new Date();
      var year = now.getFullYear();
      var month = now.getMonth();

      var tempLi = '';
      var first = true;
      var i = 0;
      do {
        var mon = ('0' + month).substr(-2);
        tempLi += '<li class="xx-item' + (first ? ' xx-active' : '') + '" data-value="' + year + '-' + mon + '">' + year + '/' + mon + '</li>';

        first = false;
        month -= 1;
        if (month == 0) {
          month = 12;
          year -= 1;
        }
        i++;

      } while (i < len);

      $('#tabsList').html(tempLi);
    },
    renderTable: function() {
      var _this = this;
      this.list = $('#list').table({
        cols: [{
          title: '城市',
          name: 'cityName',
          align: 'center',
          width: 160
        }, {
          title: '信心指数',
          name: 'confidenceIndices',
          align: 'center',
          width: 100,
          lockWidth: true,
          renderer:function(val, item, rowIndex){
            return (+val).toFixed(1);
          }
        // }, {
        //   title: '基础信心指数',
        //   name: 'baseConfidenceIndices',
        //   align: 'center',
        //   width: 140,
        //   lockWidth: true
        // }, {
        //   title: '往期信心指数',
        //   name: 'previousConfidenceIndices',
        //   align: 'center',
        //   width: 140,
        //   lockWidth: true
        }, {
          title: '最新信心表现',
          name: 'baseConfidenceIndices',
          align: 'center',
          lockDisplay: true,
          width: 140,
          lockWidth: true,
          renderer: function(val, item, rowIndex) {
            var str = 'glyphicon-minus';
            if (item.confidenceIndices > val) {
              str = 'glyphicon-arrow-up';
            } else if (item.confidenceIndices < val) {
              str = 'glyphicon-arrow-down';
            }
            return '<span class="glyphicon ' + str + '"></span>';
          }
        }, {
          title: '有效房源数',
          name: 'dealRate',
          align: 'center',
          lockDisplay: true,
          width: 140,
          lockWidth: true,
          renderer: function(val, item, rowIndex) {
            return '<div class="bangzhu-relative" style="display:inline-block"> <i class="iconfont icon-bangzhu2"></i> <div class="bangzhu-box"><div class="bangzhu">' + '<p><span>有效房源数：</span>' + item.houseCount + '套</p>' + '<p><span>价格上调：</span>' + item.housePriceUpCount + '套</p>' + '<p><span>价格不变：</span>' + item.housePriceHoldCount + '套</p>' + '<p><span>价格下调：</span>' + item.housePriceDownCount + '套</p></div></div>';
          }
        }],
        params: function(){
          return {statMonth: $('#tabsList .xx-active').data('value')}
        },
        height: 'auto',
        fullWidthRows: true,
        method: 'get',
        root: 'data',
        url: '/bi/marketing/cityHousePriceConfidenceIndicesStat.json',
        noDataText: '',
        showBackboard: false
      }).on('loadSuccess', function(e, data) {
        $(this).parent().removeClass('table-no-data');
        !data.data[0] && $(this).parent().addClass('table-no-data');

        // 提示框向上
        var len = _this.list.rowsLength();
        $(this).find('.bangzhu-box').slice(-4).css({
          top: '0',
          transform: 'translate(40%,-100%)'
        });
      });
    }
  },
  events: {
    'click #tabsList .xx-item': 'tabsItem'
  },
  handle: {
    tabsItem: function(e) {
      $(e.currentTarget).addClass('xx-active').siblings().removeClass('xx-active');
      this.list.load();
    }
  }
};
