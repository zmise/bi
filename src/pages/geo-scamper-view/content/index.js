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

      this.startStatTime = $('#startStatTime').datepicker({
        dateFormat: 'yyyy-mm-dd'
      }).data('datepicker');

      this.endStatTime = $('#endStatTime').datepicker({
        dateFormat: 'yyyy-mm-dd'
      }).data('datepicker');
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
      this.startStatTime.clear();
      this.endStatTime.clear();
    },

    queryParams: function () {
      var p = {};
      p.cityId = this.city.value ? this.city.value.id : '';
      p.startRegisterTime = this.startRegisterTime.el.value;
      p.endRegisterTime = this.endRegisterTime.el.value;
      p.startStatTime = this.startStatTime.el.value;
      p.endStatTime = this.endStatTime.el.value;
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
          title: '区域',
          name: 'areaName',
          align: 'center',
          width: 120,
          lockWidth: true
        }, {
          title: '片区',
          name: 'geographyAreaName',
          align: 'center',
          width: 100
        }, {
          title: '浏览房源量',
          name: 'accessHouseCount',
          align: 'center',
          width: 120,
          lockWidth: true
        }, {
          title: '注册用户浏览房源量',
          name: 'regAccessHouseCount',
          align: 'center',
          width: 100,
          lockWidth: true
        }, {
          title: '操作',
          name: 'checkDetail',
          align: 'center',
          width: 100,
          lockWidth: true
        }],
        method: 'get',
        url: '/bi/customer/accessGeographyAreaStat.json',
        params: function () {
          return $.extend(true, {
            sizePerPage: _this.config.sizePerPage,
            pageIndex: _this.config.pageIndex
          }, _this.params);
        },
        autoLoad: false,
        height: height,
        fullWidthRows: true,
        noDataText: '',
        indexCol: true,
        indexColWidth: 60,
        showBackboard: false,
        autoLoad: false,
        transform: function (res) {
          _this.trigger('tablepage', $.extend({}, res.data.paginator));
          _this.config.totalSize = res.data.paginator.totalSize;
          $('#statDate').text(res.data.statDate);
          var obj = _this.params;
          obj.geographyAreaId = '';
          var urlParams = '';
          for (var i = 0; i < res.data.list.length; i++) {
            obj.geographyAreaId = res.data.list[i].geographyAreaId;
            var arr = [];
            for (var j in obj) {
              if (obj.hasOwnProperty(j) && encodeURIComponent(obj[j]) !== '') {
                arr.push(encodeURIComponent(j) + "=" + encodeURIComponent(obj[j]));
              }
            }
            urlParams = arr.join("&");
            res.data.list[i].checkDetail = '<a class="targetDom" href="javascript:;" data-search="geo-scamper-detail.html?' + urlParams + '">查看明细</a>'
          }
          return res.data.list;
        }
      }).on('loadSuccess', function (e, data) {
        $(this).parent().removeClass('table-no-data');
        var $grid = $(this).closest('.mmGrid');
        $grid.removeClass('table-no-data');
        $grid.find('th').eq(0).find('.mmg-title').text('序号');
        !data && $(this).parent().addClass('table-no-data');
        $('.targetDom').on('click', function (e) {
          var $this = $(this);
          console.log($this.data('search'));
          try {
            if (parent.location.host === 'bi.qfang.com') {
              // if (parent.location.host) {
              window.open($this.data('search'));
            }
          } catch (error) {
            var tabid = '113995c5-37cf-4985-9b30-deeb1c1614f1';
            parent.postMessage({
              id: tabid,
              method: 'removeTab'
            }, '*');
            parent.postMessage({
              search: 'http://bi.qfang.com/stat-pc-front/' + $this.data('search') + '&noParseTabUrl=1',
              id: tabid,
              method: 'createTab'
            }, '*');
          }
        });
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
    },
  },

  events: {
    'click #search': 'search',
    'click #clear': 'clear',
    'click .pagebox a': 'sendpage',
  },

  handle: {
    sendpage: function (e) {
      var action = $(e.currentTarget).data('action');
      console.log(action)
      var pageIndex = this.config.pageIndex;
      var pageCount = Math.ceil(this.config.totalSize / 20);
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