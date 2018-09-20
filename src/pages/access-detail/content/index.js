var coala = require('coala');
var config = require('config');
var tpl = require('./index.html');
require('./index.css');
var summaryTpl = require('./summary.html');
var pageTpl = require('./pages.html');


module.exports = {
  tpl: tpl,
  listen: {
    mount: function () {
      this.trigger('initDefaultValue');
      this.trigger('initForm');
      this.trigger('fetchCityList', { reset: true });
    },
    // 计算默认值
    initDefaultValue: function () {
      // 缓存参数作查询和导出用
      this.params = {};
      this.config = {
        sizePerPage: 20,
        pageIndex: 1
      };
    },
    // 初始化表单
    initForm: function () {
      this.city = $('#city').select({
        placeholder: '城市',
        data: ['城市']
      });
      this.startRegisterTime = $('#startRegisterTime').datepicker({
        dateFormat: 'yyyy-mm-dd'
      }).data('datepicker');

      this.endRegisterTime = $('#endRegisterTime').datepicker({
        dateFormat: 'yyyy-mm-dd'
      }).data('datepicker');

      var itemData = [
        { id: 'registerTime', name: '注册时间' },
        { id: 'recentLoginTime', name: '最近一次登录时间' },
        { id: 'firstLoginTime', name: '首次登录时间' },
        { id: 'firstAccessHouseTime', name: '首次浏览房源时间' },
        { id: 'firstFollowGardenTime', name: '首次关注小区时间' },
        { id: 'firstFollowHouseTime', name: '首次关注房源时间' },
        { id: 'firstQchatTime', name: '首次Q聊时间' },
        { id: 'firstCallInlineDate', name: '首次进线时间' },
        { id: 'firstOrderLookDate', name: '首次预约带看时间' },
        { id: 'firstLookDate', name: '首次带看时间' },
      ];
      this.sourceIndex = $('#sourceIndex').select({
        placeholder: '对比项',
        data: itemData
      });

      this.targetIndex = $('#targetIndex').select({
        placeholder: '对比项',
        data: itemData
      });
    },
    fetchCityList: function (opt) {
      var _this = this;
      $.ajax({
        url: '/bi/common/areaList.json',
        data: {
          areaType: 1
        }
      }).then(function (res) {
        _this.city.option.data = res.data;
        _this.city.render();
        _this.defaultCity = '';
        for (var i = 0; i < res.data.length; i++) {
          if (res.data[i].fullPinYin === 'QINGDAO') {
            _this.defaultCity = res.data[i];
          }
        }
      }).done(function () {
        if (opt && opt.reset) {
          _this.city.setValue(_this.defaultCity);
          _this.trigger('renderTable');
          _this.trigger('query');
        }
      });
    },
    resetForm: function () {
      this.city.setValue(this.defaultCity);
      this.startRegisterTime.clear();
      this.endRegisterTime.clear();
      this.sourceIndex.clearValue();
      this.targetIndex.clearValue();
      // 清空手机号码，天，小时，分钟
      this.$('#cellPhone').val('');
      this.$('#days').val('');
      this.$('#hours').val('');
      this.$('#minutes').val('');
      $('#city').trigger('bs.select.select');
    },

    queryParams: function () {
      var p = {};
      p.cityId = this.city.value ? this.city.value.id : '';
      p.startRegisterTime = this.startRegisterTime.el.value;
      p.endRegisterTime = this.endRegisterTime.el.value;
      p.cellPhone = this.$('#cellPhone').val();
      p.sourceIndex = this.sourceIndex.value ? this.sourceIndex.value.id : '';
      p.targetIndex = this.targetIndex.value ? this.targetIndex.value.id : '';
      p.days = this.$('#days').val();
      p.hours = this.$('#hours').val();
      p.minutes = this.$('#minutes').val();
      this.params = p;
    },
    // 查询
    query: function () {
      this.trigger('queryParams');
      this.config.pageIndex = 1;
      this.list.load();
      this.trigger('tablepage', []);

    },

    // 列表渲染
    renderTable: function () {
      var _this = this;
      var height = $(window).height() - _this.$('#filter').outerHeight(true) - 100;
      this.list = $('#list').table({
        //height: 360,
        cols: [{
          title: '手机号码',
          name: 'cellPhone',
          align: 'center',
          width: 120,
          lockWidth: true
        }, {
          title: '注册日期',
          name: 'registerTime',
          align: 'center',
          width: 100
        }, {
          title: '最近登陆日期',
          name: 'recentLoginTime',
          align: 'center',
          width: 120,
          lockWidth: true
        }, {
          title: '首次登录日期',
          name: 'firstLoginTime',
          align: 'center',
          width: 120,
          lockWidth: true
        }, {
          title: '首次浏览房源',
          name: 'firstAccessHouseTime',
          align: 'center',
          width: 100,
          lockWidth: true
        }, {
          title: '首次关注小区',
          name: 'firstFollowGardenTime',
          align: 'center',
          width: 100,
          lockWidth: true
        }, {
          title: '首次关注房源',
          name: 'firstFollowHouseTime',
          align: 'center',
          width: 100,
          lockWidth: true
        }, {
          title: '首次Q聊',
          name: 'firstQchatTime',
          align: 'center',
          width: 100,
          lockWidth: true
        }, {
          title: '首次进线',
          name: 'firstCallInlineDate',
          align: 'center',
          width: 100,
          lockWidth: true
        }, {
          title: '首次预约带看',
          name: 'firstOrderLookDate',
          align: 'center',
          width: 100,
          lockWidth: true
        }, {
          title: '首次带看',
          name: 'firstLookDate',
          align: 'center',
          width: 100,
          lockWidth: true
        }],
        method: 'get',
        url: '/bi/customer/accessNodeStat.json',
        params: function () {
          return $.extend(true, {
            sizePerPage: _this.config.sizePerPage,
            pageIndex: _this.config.pageIndex
          }, _this.params);
        },
        autoLoad: false,
        // root: 'data',
        height: height,
        fullWidthRows: true,
        noDataText: '',
        // nowrap: true,
        indexCol: true,
        indexColWidth: 60,
        showBackboard: false,
        autoLoad: false,
        transform: function (res) {
          _this.trigger('tablepage', $.extend({}, res.data.paginator));
          _this.config.totalSize = res.data.paginator.totalSize;
          $('#statDate').text(res.data.statDate);
          return res.data.list;
        }
      }).on('loadSuccess', function (e, data) {
        $(this).parent().removeClass('table-no-data');
        var $grid = $(this).closest('.mmGrid');
        $grid.removeClass('table-no-data');
        $grid.find('th').eq(0).find('.mmg-title').text('序号');
        !data && $(this).parent().addClass('table-no-data');
      });
    },
    tablepage: function (data) {
      var _this = this;
      $('#tablepage').html(pageTpl(data)).show();
      var itemData = [
        { id: 10, name: 10 },
        { id: 20, name: 20 },
        { id: 60, name: 60 },
        { id: 80, name: 80 },
        { id: 100, name: 100 },

      ];
      this.sizePerPage = $('#sizePerPage').select({
        data: itemData
      });
      this.sizePerPage.setValue({
        id: _this.config.sizePerPage, name: _this.config.sizePerPage
      });
      $('#sizePerPage').on('bs.select.select', function (e, item) {
        _this.config.sizePerPage = _this.sizePerPage.value.id;
        _this.trigger('query');
      });
    }
  },

  events: {
    'click #search': 'search',
    'click #clear': 'clear',
    'click .pagebox a': 'sendpage',
    'input .js-input-number': 'inputNumber',
    'change #inputPage': 'inputpage',
  },

  handle: {
    inputpage: function (e) {
      this.config.pageIndex = $(e.currentTarget).val();
      this.list.load($.extend({}, this.params, {
        pageIndex: this.config.pageIndex,
        sizePerPage: this.config.pageSize
      }));
    },
    inputNumber: function (e) {
      var $this = $(e.currentTarget);
      $this.val($this.val().replace(/[^\d.]/g, ''));
    },
    sendpage: function (e) {
      var action = $(e.currentTarget).data('action');
      var pageIndex = this.config.pageIndex;
      var pageCount = Math.ceil(this.config.totalSize / this.config.sizePerPage);
      if (pageCount === 1) {
        return false;
      }

      if (pageIndex !== 1 && action === 'first') {
        this.config.pageIndex = pageIndex = 1;
      } else if (pageIndex !== 1 && action === 'prev') {
        this.config.pageIndex = --pageIndex;
      } else if (pageIndex !== pageCount && action === 'next') {
        this.config.pageIndex = ++pageIndex;
      } else if (pageIndex !== pageCount && action === 'last') {
        this.config.pageIndex = pageIndex = pageCount;
      } else {
        return false;
      }

      this.list.load($.extend({}, this.params, {
        pageIndex: this.config.pageIndex,
        sizePerPage: this.config.pageSize
      }));
    },
    search: function () {
      this.trigger('query');
    },
    clear: function () {
      this.trigger('resetForm');
    }
  }
};
