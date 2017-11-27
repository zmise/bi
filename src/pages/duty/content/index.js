var coala = require('coala');

var config = require('config');
var tpl = require('./index.html');
require('./index.css');
var summaryTpl = require('./summary.html');
var pageTpl = require('./pages.html');

var orgType = {
  1: 'city',
  2: 'district',
  3: 'area',
  4: 'region'
};


module.exports = {
  tpl: tpl,
  listen: {
    mount: function () {

      this.trigger('initDefaultValue');
      this.trigger('initForm');
      this.trigger('fetchDefaultCity');
    },
    // 计算默认值
    initDefaultValue: function () {
      // 缓存参数作查询和导出用
      this.params = {};
      this.config = {
        pageSize: 20,
        currentPage: 1
      };
    },
    formRender: function () {
      this.trigger('renderTable');
      this.trigger('resetForm');
      this.trigger('query');
    },

    fetchURIParams: function () {
      var infos = {};
      var arrs = location.search.substr(1).split('&');
      arrs.forEach(function (v, i, arr) {
        var items = v.split('=');
        infos[items[0]] = items[1];
      });

      this.URIinfos = infos;
    },
    resetForm: function () {

      // 对当前级别的下拉设置默认值
      this[orgType[this.maxPermissionOrgType]].setValue(this.defaultCity);

      // 清空市占率 。楼盘名称
      this.$('#minDealRate').val('');
      this.$('#maxDealRate').val('');
      this.garden.clearValue();

      // 重置默认月份，和最大最小可选月份。
      var targetDate = new Date();
      this.time.update({
        maxDate: new Date(targetDate.getFullYear(), targetDate.getMonth() - 1, 1),
        minDate: new Date(2016, 0, 1)
      });
      targetDate.setMonth(targetDate.getMonth() - 2);
      this.time.selectDate(targetDate);

      $('#' + orgType[this.maxPermissionOrgType]).trigger('bs.select.select');

    },
    queryParams: function () {
      var p = {};

      if (this.region.value) {
        p.orgType = 4;
        p.orgId = this.region.value.id;
        p.orgName = this.region.value.name;
      } else if (this.area.value) {
        p.orgType = 3;
        p.orgId = this.area.value.id;
        p.orgName = this.area.value.name;
      } else if (this.district.value) {
        p.orgType = 2;
        p.orgId = this.district.value.id;
        p.orgName = this.district.value.name;
      } else if (this.city.value) {
        p.orgType = 1;
        p.orgId = this.city.value.id;
        p.orgName = this.city.value.name;
      }

      p.statMonth = this.time.el.value;
      p.gardenIds = this.garden.value ? this.garden.value.id : '';
      p.minDealRate = this.$('#minDealRate').val();
      p.maxDealRate = this.$('#maxDealRate').val();

      this.params = p;
    },
    fetchDefaultCity: function () {
      var _this = this;
      $.ajax({
        url: '/bi/marketing/orgBaseInfo.json'
      }).done(function (res) {
        _this.defaultCity = res.data.defaultOrg;
        _this.maxPermissionOrgType = res.data.maxPermissionOrgType;


        if (_this.maxPermissionOrgType == 1) {
          _this.$('.bi-dropdown-list:lt(5)').removeClass('bi-dropdown-list');
        } else {
          _this.$('.bi-dropdown-list:lt(5)').filter(':gt(' + (_this.maxPermissionOrgType - 2) + ')').removeClass('bi-dropdown-list');
        }

        // 根据当前权限级别获取下拉数据
        var target = orgType[_this.maxPermissionOrgType].replace(/\w/, function (char) {
          return char.toUpperCase();
        });
        _this.trigger('fetch' + target + 'List', { initEvent: true });
      });
    },
    // 获取城市列表
    fetchCityList: function (opt) {
      var _this = this;
      $.ajax({
        url: '/bi/common/orgList.json',
        data: {
          orgType: 1
        }
      }).then(function (res) {
        // res.data.unshift({
        //   id: '',
        //   name: "全国"
        // });
        _this.city.option.data = res.data;
        _this.city.render();

      }).done(function () {
        opt && opt.initEvent && _this.trigger('formRender');
      });
    },
    fetchDistrictList: function (opt) {
      this.district.clearValue();
      var _this = this;
      $.ajax({
        url: '/bi/common/orgList.json',
        data: {
          orgType: 2,
          parentLongNumbers: opt.longNumber
        }
      }).then(function (res) {
        if (res.data.length) {
          $('#district').show();

          if (_this.maxPermissionOrgType != 2) {
            res.data.unshift({ id: '-1', name: "全部大区" });
          }
          _this.district.option.data = res.data;
          _this.district.render();
          _this.district.enable();

          _this.area.clearValue();
          _this.area.disable();

        } else {

          $('#district').hide();
          _this.district.clearValue();
          _this.district.disable();

          _this.trigger('fetchAreaList', { longNumber: opt.longNumber });

        }

      }).done(function () {
        opt && opt.initEvent && _this.trigger('formRender');
      });
    },

    fetchAreaList: function (opt) {
      this.area.clearValue();
      var _this = this;
      $.ajax({
        url: '/bi/common/orgList.json',
        data: {
          orgType: 3,
          parentLongNumbers: opt.longNumber
        }
      }).then(function (res) {

        if (_this.maxPermissionOrgType != 3) {
          res.data.unshift({ id: '-1', name: "全部区域" });
        }
        _this.area.option.data = res.data;
        _this.area.render();
        _this.area.enable();

        _this.region.clearValue();
        _this.region.disable();

      }).done(function () {
        opt && opt.initEvent && _this.trigger('formRender');
      });
    },

    fetchRegionList: function (opt) {
      this.region.clearValue();
      var _this = this;
      $.ajax({
        url: '/bi/common/orgList.json',
        data: {
          orgType: 4,
          parentLongNumbers: opt.longNumber
        }
      }).then(function (res) {
        if (!res.data) {
          _this.region.enable();
          return;
        }

        if (_this.maxPermissionOrgType != 4) {
          res.data.unshift({ id: '-1', name: "全部片区" });
        }
        _this.region.option.data = res.data;
        _this.region.render();
        _this.region.enable();

        _this.subbranch.clearValue();
        _this.subbranch.disable();
      }).done(function () {
        opt && opt.initEvent && _this.trigger('formRender');
      });
    },
    // 初始化表单
    initForm: function () {
      var _this = this;
      this.city = $('#city').select({
        placeholder: '城市',
        data: ['全国']
      });

      this.district = $('#district').select({
        placeholder: '全部大区',
        data: ['全部大区']
      });

      this.area = $('#area').select({
        placeholder: '全部区域',
        data: ['全部区域']
      });

      this.region = $('#region').select({
        placeholder: '全部片区',
        data: ['全部片区'],
      });
      this.subbranch = $('#subbranch').select({
        placeholder: '分店',
        data: ['全部分店'],
      });

      this.garden = $('#garden').select({
        search: true,
        url: '/bi/common/orgGardenList.json',
        placeholder: '输入楼盘名称',
        keyword: 'keyWord',
        params: function () {
          return {
            cityOrgId: _this.city.value.id
          }
        },
        //  function(){
        //   return {
        //     city: 'SHENZHEN' //_this.city.value.pinyin
        //   }
        // },
        dataFormater: function (data) {
          return data.data;
        }
      });

      this.time = $('#selectedMonth').datepicker({
        minView: 'months',
        view: 'months',
        dateFormat: 'yyyy-mm',
        position: 'bottom center'
      }).data('datepicker');

      // },
      // 设置表单监听事件
      // initEvent: function () {
      $('#city').on('bs.select.select', function (e, item) {
        var id = _this.city.value.id;
        var longNumber = _this.city.value.longNumber;

        //组织类型： 1: 城市
        // _this.params.orgType = 1;
        // _this.params.orgId = id;

        _this.trigger('fetchDistrictList', { longNumber: longNumber });

        // _this.list && _this.trigger('query');
      });

      $('#district').on('bs.select.select', function (e, item) {
        var id = _this.district.value.id;
        var longNumber = _this.district.value.longNumber;

        if (id == '-1') {
          _this.district.clearValue();
          _this.area.clearValue();
        } else {
          _this.trigger('fetchAreaList', { longNumber: longNumber });
        }

        // _this.list && _this.trigger('query');
      }).on('bs.select.clear', function () {
        _this.area.clearValue();
        _this.area.disable();
      });

      $('#area').on('bs.select.select', function (e, item) {
        var id = _this.area.value.id;
        var longNumber = _this.area.value.longNumber;

        if (id == '-1') {
          _this.area.clearValue();
        } else {
          _this.trigger('fetchRegionList', { longNumber: longNumber });
        }

        // _this.list && _this.trigger('query');
      }).on('bs.select.clear', function () {
        _this.region.clearValue();
        _this.region.disable();
      });

      $('#region').on('bs.select.select', function (e, item) {
        var id = _this.region.value.id;
        var longNumber = _this.region.value.longNumber;

        if (id == '-1') {
          _this.region.clearValue();
        } else {
          _this.trigger('fetchSubbranchList', { longNumber: longNumber });
        }
        // _this.list && _this.trigger('query');
      });


    },
    tablepage: function (data) {
      data.currentPage = this.config.currentPage;
      $('#tablepage').html(pageTpl(data)).show();
    },
    // 查询
    query: function () {
      this.trigger('queryParams');


      this.trigger('renderStat');
      this.config.currentPage = 1;
      this.list.load();
      this.trigger('tablepage', []);
    },
    // 组织责任盘市占接口
    renderStat: function () {
      var _this = this;
      $.ajax({
        url: '/bi/marketing/org/duty/statByOrg.json',
        data: {
          statMonth: _this.params.statMonth,
          orgType: _this.params.orgType,
          orgId: _this.params.orgId
        },
        dataType: 'JSON'
      }).done(function (res) {
        if (res.status) {
          return;
        }
        if (!res.data) {
          res.data = {};
        }

        res.data.itemName = _this.params.orgName + _this.params.statMonth.replace('-', '年') + '月';
        _this.$('#summary').html(summaryTpl(res.data));
      });
    },
    // 列表渲染
    renderTable: function () {
      var _this = this;
      var height = $(window).height() - _this.$('#filter').outerHeight(true) - 125;
      this.list = $('#list').table({
        //height: 360,
        cols: [{
          title: '建模城市',
          name: 'cityName',
          align: 'center',
          width: 100
        }, {
          title: '建模区域',
          name: 'areaName',
          align: 'center',
          width: 130
        }, {
          title: '建模片区',
          name: 'subAreaName',
          align: 'center',
          width: 130
        }, {
          title: '楼盘名',
          name: 'gardenName',
          align: 'center',
          width: 260
        }, {
          title: '我司递件数',
          name: 'wsTransferCount',
          align: 'center',
          width: 130
        }, {
          title: '国土过户数',
          name: 'gtTransferCount',
          align: 'center',
          width: 130
        }, {
          title: '市占率',
          name: 'dealRate',
          align: 'center',
          width: 120,
          renderer: function (val, item, rowIndex) { return val + '%'; }
        }],
        method: 'get',
        url: '/bi/marketing/org/duty/pagingStatByGarden.json',
        params: function (data) {
          console.log(data);
          return $.extend(true, {
            currentPage: _this.config.currentPage,
            pageSize: _this.config.pageSize
          }, _this.params);
          // {
          //   statMonth: _this.time.value.id,
          //   orgType: _this.params.type,
          //   orgId: _this.params.ids,
          //   gardenIds: _this.params.gardenIds,
          //   minDealRate: _this.params.minDealRate,
          //   maxDealRate: _this.params.maxDealRate,
          //   currentPage: _this.config.currentPage,
          //   pageSize: _this.config.pageSize,
          // }
        },
        transform: function (res) {
          if (res.status !== 0) {
            console.warn('数据异常！');
            return false;
          }

          _this.config.pageCount = res.data.pageCount || 1;
          _this.config.total = res.data.total;
          _this.trigger('tablepage', res.data);
          return res.data.itemList;
        },
        height: height,
        // fullWidthRows: true,
        noDataText: '',
        nowrap: true,
        showBackboard: false,
        autoLoad: false
      }).on('loadSuccess', function (e, data) {
        $(this).parent().removeClass('table-no-data');
        !data && $(this).parent().addClass('table-no-data');
      });
    },
  },

  events: {
    'click #search': 'search',
    'click #clear': 'clear',
    'input .js-input-number': 'inputNumber',
    'click .pagebox a': 'sendpage'
  },

  handle: {
    search: function () {
      this.trigger('query');
    },
    clear: function () {
      this.trigger('resetForm');
    },
    inputNumber: function (e) {
      var $this = $(e.currentTarget);
      $this.val($this.val().replace(/[^\d.]/g, ''));
    },
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

      this.list.load();
    }
  }
};
