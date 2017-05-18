var coala = require('coala');
var config = require('config');
var tpl = require('./index.html');
require('./index.css');

module.exports = {
  tpl: tpl,
  listen: {
    mount: function() {
      this.trigger('renderTable');
    },
    renderTable: function() {
      this.list = $('#list').table({
        cols: [{
          title: '城市',
          name: 'orgName',
          align: 'center',
          width: 160
        }, {
          title: '信心指数',
          name: 'wsHouseCount',
          align: 'center',
          width: 100,
          lockWidth: true
        }, {
          title: '基础信心指数',
          name: 'gtHouseCount',
          align: 'center',
          width: 140,
          lockWidth: true
        }, {
          title: '往期信心指数',
          name: 'houseRate',
          align: 'center',
          width: 140,
          lockWidth: true
        }, {
          title: '最新信心表现',
          name: 'wsTransferCount',
          align: 'center',
          lockDisplay: true,
          width: 140,
          lockWidth: true,
          renderer: function(val, item, rowIndex) {
            if (val > 30) {
              return '<span class="glyphicon glyphicon-arrow-up"></span>';
            }
            return '<span class="glyphicon glyphicon-arrow-down"></span>';
          }
        }, {
          title: '统计日期',
          name: 'gtTransferCount',
          align: 'center',
          lockDisplay: true,
          width: 140,
          lockWidth: true
        }, {
          title: '抽样说明',
          name: 'dealRate',
          align: 'center',
          lockDisplay: true,
          width: 140,
          lockWidth: true,
          renderer: function(val, item, rowIndex) {
            return '<div class="bangzhu-relative"> <i class="iconfont icon-bangzhu2"></i> <div class="bangzhu-box"><div class="bangzhu"><p><span>抽样房源数：</span>56784套</p><p><span>价格上调：</span>56784套</p><p><span>价格不变：</span>56784套</p><p><span>价格下调：</span>56784套</p></div></div>';
          }
        }],
        params: {
          month: $('#tabsList .xx-active').text()
        },
        height: 'auto',
        fullWidthRows:true,
        method: 'get',
        root: 'data',
        url: '/bi/confidence/confidence.json',
        noDataText: '',
        showBackboard: false
      }).on('loadSuccess', function(e, data) {
        $(this).parent().removeClass('table-no-data');
        !data && $(this).parent().addClass('table-no-data');
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
