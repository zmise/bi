var coala = require('coala');
var ec = require('echarts/echarts');
require('echarts/chart/pie');
var config = require('config');
var tpl = require('./index.html');
require('./index.css');
var summaryTpl = require('./summary.html');
var pageTpl = require('./pages.html');
var orgType = {
  1: 'city',
  2: 'district',
  3: 'area',
  4: 'region',
  5: 'subbranch'
};
// 城市写死深圳
var city = {
  id: '199aad42-ad8d-4eec-8281-657bcc6c9f22',
  name: '大深圳区域',
  longNumber: 'SHJT!JMSYB1312266912!SGQ1509165477!SZSH1409237134'
};
module.exports = {
  tpl: tpl,
  listen: {
    mount: function () {
      this.trigger('initDefaultValue');
      this.trigger('initForm');
      this.trigger('fetchDefaultCity');
      this.trigger('fetchURIParams');
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
    formRender: function () {
      this.trigger('resetForm');
      this.trigger('uriToForm');
      this.trigger('renderTable');
      if (!this.URIinfos.checkMonth) {
        this.trigger('query');
      }
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
    uriToForm: function () {
      var data = this.URIinfos;
      if (!data.checkMonth) {
        return;
      }
      this.time.selectDate(new Date(data.checkMonth));
      // 根据当前权限级别获取下拉数据
      var target = orgType[this.maxPermissionOrgType].replace(/\w/, function (char) {
        return char.toUpperCase();
      });
      this.trigger('fetch' + target + 'List', { uri: true });
      // this[orgType[this.maxPermissionOrgType]].setValueById(data[orgType[this.maxPermissionOrgType]]);
      // $('#' + orgType[this.maxPermissionOrgType]).trigger('bs.select.select');
    },
    resetForm: function () {
      // 对当前级别的下拉设置默认值
      this[orgType[this.maxPermissionOrgType]].setValue(this.defaultCity);
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
      if (this.subbranch.value) {
        p.type = 5;
        p.ids = this.subbranch.value.id;
      } else if (this.region.value) {
        p.type = 4;
        p.ids = this.region.value.id;
      } else if (this.area.value) {
        p.type = 3;
        p.ids = this.area.value.id;
      } else if (this.district.value) {
        p.type = 2;
        p.ids = this.district.value.id;
      } else if (this.city.value) {
        p.type = 1;
        p.ids = this.city.value.id;
      }
      // 其他参数
      p.time = this.time.el.value;
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
        // 城市写死深圳
        $.each(res.data, function (i, v) {
          if (v.id === city.id) {
            $.extend(_this.defaultCity, city, v);
            res.data = [v];
            return false;
          }
        });
        _this.city.option.data = res.data;
        _this.city.render();
        if (_this.URIinfos.city && opt.uri) {
          _this.city.setValueById(_this.URIinfos.city);
          if (_this.URIinfos.district) {
            _this.trigger('fetchDistrictList', {
              longNumber: _this.city.value.longNumber,
              uri: true
            });
          } else if (_this.URIinfos.area) {
            $('#district').hide();
            _this.district.clearValue();
            _this.district.disable();
            _this.trigger('fetchAreaList', {
              longNumber: _this.city.value.longNumber,
              uri: true
            });
          } else {
            $('#city').trigger('bs.select.select');
            _this.trigger('query');
          }
        }
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
          if (_this.URIinfos.district && opt.uri) {
            _this.district.setValueById(_this.URIinfos.district);
            if (_this.URIinfos.area) {
              _this.trigger('fetchAreaList', {
                longNumber: _this.district.value.longNumber,
                uri: true
              });
            } else {
              $('#district').trigger('bs.select.select');
              _this.trigger('query');
            }
          }
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
      this.area.disable();
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
        if (_this.URIinfos.area && opt.uri) {
          _this.area.setValueById(_this.URIinfos.area);
          $('#area').trigger('bs.select.select');
          _this.trigger('query');
        }
        _this.region.clearValue();
        _this.region.disable();
      }).done(function () {
        opt && opt.initEvent && _this.trigger('formRender');
      });
    },
    fetchRegionList: function (opt) {
      this.region.clearValue();
      this.region.disable();
      var _this = this;
      $.ajax({
        url: '/bi/common/orgList.json',
        data: {
          orgType: 4,
          parentLongNumbers: opt.longNumber
        }
      }).then(function (res) {
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
    fetchSubbranchList: function (opt) {
      this.subbranch.clearValue();
      this.subbranch.disable();
      var _this = this;
      $.ajax({
        url: '/bi/common/orgList.json',
        data: {
          orgType: 5,
          parentLongNumbers: opt.longNumber
        }
      }).then(function (res) {
        if (_this.maxPermissionOrgType != 5) {
          res.data.unshift({ id: '-1', name: "全部分店" });
        }
        _this.subbranch.option.data = res.data;
        _this.subbranch.render();
        _this.subbranch.enable();
      }).done(function () {
        opt && opt.initEvent && _this.trigger('formRender');
      });
    },
    // 初始化表单
    initForm: function () {
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
      this.time = $('#selectedMonth').datepicker({
        minView: 'months',
        view: 'months',
        dateFormat: 'yyyy-mm'
      }).data('datepicker');
      // this.time = $('#time').select({
      //   placeholder: '年/月',
      //   data: this.data,
      //   value: this.data[0]
      // });
      // },
      // 设置表单监听事件
      // initEvent: function () {
      var _this = this;
      $('#city').on('bs.select.select', function (e, item) {
        var id = _this.city.value.id;
        var longNumber = _this.city.value.longNumber;
        //组织类型： 1: 城市
        _this.params.type = 1;
        _this.params.ids = id;
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
      }).on('bs.select.clear', function () {
        _this.subbranch.clearValue();
        _this.subbranch.disable();
      });
      $('#subbranch').on('bs.select.select', function (e, item) {
        var id = _this.subbranch.value.id;
        var longNumber = _this.subbranch.value.longNumber;
        if (id == '-1') {
          _this.subbranch.clearValue();
        }
        // _this.list && _this.trigger('query');
      });
    },
    tablepage: function (data) {
      data.pageIndex = this.config.pageIndex;
      $('#tablepage').html(pageTpl(data)).show();
    },
    // 查询
    query: function () {
      this.trigger('queryParams');
      this.trigger('renderStat');
      this.list.load();
      this.trigger('tablepage', []);
    },
    // 责任盘维护人员配比健康度统计接口
    renderStat: function () {
      var _this = this;
      $.ajax({
        url: '/bi/marketing/orgDutyBrokerHealthRate/stat.json',
        data: {
          statMonth: _this.params.time,
          orgType: _this.params.type,
          orgId: _this.params.ids
        },
        dataType: 'JSON'
      }).done(function (res) {
        if (res.status) {
          return;
        }
        _this.$('#summary').html(summaryTpl(res.data));
      });
    },
    // 列表渲染
    renderTable: function () {
      var _this = this;
      var height = $(window).height() - _this.$('#filter').outerHeight(true) - 225;
      this.list = $('#list').table({
        //height: 360,
        cols: [{
          title: '区域',
          name: 'areaOrgName',
          align: 'center',
          width: 120,
          lockWidth: true
        }, {
          title: '片区',
          name: 'subAreaOrgName',
          align: 'center',
          width: 120,
          lockWidth: true
        }, {
          title: '分店名称',
          name: 'branchOrgName',
          align: 'center',
          width: 180
        }, {
          title: '责任盘户数',
          name: 'dutyRoomCount',
          align: 'center',
          width: 100,
          lockWidth: true
        }, {
          title: '人均维护',
          name: 'dutyRoomBrokerAvg',
          align: 'center',
          width: 100,
          lockWidth: true
        }, {
          title: '月末在职人数',
          name: 'lastMonthOnJobBrokerCount',
          align: 'center',
          width: 100,
          lockWidth: true
        }, {
          title: '应配经纪人数',
          name: 'exceptBrokerCount',
          align: 'center',
          width: 100,
          lockWidth: true
        }, {
          title: '建议招聘',
          name: 'needBrokerCount',
          align: 'center',
          width: 100,
          lockWidth: true
        }, {
          title: '人员情况',
          name: 'brokerStatus',
          align: 'center',
          width: 100,
          lockWidth: true,
          renderer: function (val, item, rowIndex) {
            switch (val) {
              case 'NOT_ENOUGH': return '<span class="red-desc">不足</span>';
              case 'UNDERSTAFFED': return '<span class="yellow-desc">紧张</span>';
              case 'ENOUGH': return '<span class="green-desc">充足</span>';
            }
          }
        }],
        method: 'get',
        url: '/bi/marketing/orgDutyBrokerHealthRate/branchPagingStat.json',
        params: function () {
          return {
            statMonth: _this.params.time,
            orgType: _this.params.type,
            orgId: _this.params.ids,
            sizePerPage: _this.config.sizePerPage,
            pageIndex: _this.config.pageIndex
          }
        },
        transform: function (res) {
          if (res.status !== 0) {
            console.warn('数据异常！');
            return false;
          }
          _this.config.pages = res.data.paginator.pages || 1;
          _this.config.totalSize = res.data.paginator.totalSize;
          _this.trigger('tablepage', res.data.paginator);
          return res.data.list;
        },
        root: 'data',
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
    'click .pagebox a': 'sendpage'
  },
  handle: {
    search: function () {
      this.trigger('query');
    },
    clear: function () {
      this.trigger('resetForm');
    },
    sendpage: function (e) {
      var action = $(e.currentTarget).data('action');
      var pageIndex = this.config.pageIndex;
      var pages = this.config.pages;
      if (pages === 1) {
        return false;
      }
      if (pageIndex !== 1 && action === 'first') {
        this.config.pageIndex = pageIndex = 1;
      } else if (pageIndex !== 1 && action === 'prev') {
        this.config.pageIndex = --pageIndex;
      } else if (pageIndex !== pages && action === 'next') {
        this.config.pageIndex = ++pageIndex;
      } else if (action === 'last' && pageIndex !== pages) {
        this.config.pageIndex = pageIndex = pages;
      } else {
        return false;
      }
      this.list.load();
    }
  }
};
