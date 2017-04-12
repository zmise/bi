var coala = require('coala');
var config = require('config');
var tpl = require('./index.html');
var rank = require('components/rank');
require('./index.css');

var ec = require('echarts/echarts');
require('echarts/chart/line');
require('echarts/chart/bar');

var orgType = {
  1: 'city',
  2: 'district',
  3: 'area',
  4: 'region',
  5: 'subbranch'
};

module.exports = {
  tpl: tpl,
  refs: {
    rank: {
      component: rank,
      el: '#main'
    }
  },
  listen: {
    init: function() {
      // 缓存参数作查询和导出用
      this.params = {};
      this.queryData = function() {
        return {
          startMonth: this.startMonth.el.value,
          endMonth: this.endMonth.el.value,
          entityType: this.params.type,
          entityId: this.params.ids
        }
      };
    },
    mount: function() {
      this.trigger('initForm');
      this.trigger('fetchDefaultCity');
    },
    fetchDefaultCity: function() {
      var _this = this;
      $.ajax({
        url: '/bi/marketing/orgBaseInfo.json'
      }).done(function(res) {
        _this.defaultCity = res.data.defaultOrg;
        _this.maxPermissionOrgType = res.data.maxPermissionOrgType || 1;


        if (_this.maxPermissionOrgType == 1) {
          $('#filter .bi-dropdown-list:lt(5)').removeClass('bi-dropdown-list');
        } else {
          $('#filter .bi-dropdown-list:lt(5)').filter(':gt(' + (_this.maxPermissionOrgType - 2) + ')').removeClass('bi-dropdown-list');
        }
        $('#filter').css('visibility', 'visible');

        // 根据当前权限级别获取下拉数据
        var target = orgType[_this.maxPermissionOrgType].replace(/\w/, function(char) {
          return char.toUpperCase();
        });
        _this.trigger('fetch' + target + 'List', { reset: true });
      });
    },
    formRender: function() {
      this.trigger('resetForm');

      this.trigger('queryParams');
    },
    fetchCityList: function(opt) {
      var _this = this;
      $.ajax({
        url: '/bi/common/orgList.json',
        data: {
          orgType: 1
        }
      }).then(function(res) {
        _this.city.option.data = res.data;
        _this.city.render();
      }).done(function() {
        opt && opt.reset && _this.trigger('formRender');
      });
    },
    fetchDistrictList: function(opt) {
      this.district.clearValue();
      this.district.disable();
      var _this = this;
      $.ajax({
        url: '/bi/common/orgList.json',
        data: {
          orgType: 2,
          parentLongNumbers: opt.longNumber
        }
      }).then(function(res) {
        if (res.data.length) {
          $('#district').show();
          $('#district').parent().show();

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
          $('#district').parent().hide();
          _this.district.clearValue();
          _this.district.disable();

          _this.trigger('fetchAreaList', { longNumber: opt.longNumber });
        }

      }).done(function() {
        opt && opt.reset && _this.trigger('formRender');
      });
    },
    fetchAreaList: function(opt) {
      this.area.clearValue();
      this.area.disable();
      var _this = this;
      $.ajax({
        url: '/bi/common/orgList.json',
        data: {
          orgType: 3,
          parentLongNumbers: opt.longNumber
        }
      }).then(function(res) {

        if (_this.maxPermissionOrgType != 3) {
          res.data.unshift({ id: '-1', name: "全部区域" });
        }
        _this.area.option.data = res.data;
        _this.area.render();
        _this.area.enable();

        _this.region.clearValue();
        _this.region.disable();
      }).done(function() {
        opt && opt.reset && _this.trigger('formRender');
      });
    },
    fetchRegionList: function(opt) {
      this.region.clearValue();
      this.region.disable();
      var _this = this;
      $.ajax({
        url: '/bi/common/orgList.json',
        data: {
          orgType: 4,
          parentLongNumbers: opt.longNumber
        }
      }).then(function(res) {

        if (_this.maxPermissionOrgType != 4) {
          res.data.unshift({ id: '-1', name: "全部片区" });
        }
        _this.region.option.data = res.data;
        _this.region.render();
        _this.region.enable();

        _this.subbranch.clearValue();
        _this.subbranch.disable();
      }).done(function() {
        opt && opt.reset && _this.trigger('formRender');
      });
    },
    fetchSubbranchList: function(opt) {
      this.subbranch.clearValue();
      this.subbranch.disable();
      var _this = this;
      $.ajax({
        url: '/bi/common/orgList.json',
        data: {
          orgType: 5,
          parentLongNumbers: opt.longNumber
        }
      }).then(function(res) {

        if (_this.maxPermissionOrgType != 5) {
          res.data.unshift({ id: '-1', name: "全部分店" });
        }
        _this.subbranch.option.data = res.data;
        _this.subbranch.render();
        _this.subbranch.enable();
      }).done(function() {
        opt && opt.reset && _this.trigger('formRender');
      });
    },
    initForm: function() {
      var _this = this;
      this.city = $('#city').select({
        placeholder: '城市',
        data: ['城市']
      });
      $('#city').on('bs.select.select', function(e, item) {
        var id = _this.city.value.id;
        var longNumber = _this.city.value.longNumber;

        //组织类型： 1: 城市
        _this.params.type = 1;
        _this.params.ids = id;

        _this.trigger('fetchDistrictList', { longNumber: longNumber });

        _this.trigger('query');
      });
      this.district = $('#district').select({
        placeholder: '全部大区',
        data: ['全部大区']
      });
      $('#district').on('bs.select.select', function(e, item) {
        var id = _this.district.value.id;
        var longNumber = _this.district.value.longNumber;

        if (id == '-1') {
          _this.district.clearValue();
          _this.area.clearValue();
        } else {
          _this.trigger('fetchAreaList', { longNumber: longNumber });
        }

        _this.trigger('query');
      }).on('bs.select.clear', function() {
        _this.area.clearValue();
        _this.area.disable();
      });

      this.area = $('#area').select({
        placeholder: '全部区域',
        data: ['全部区域']
      });
      $('#area').on('bs.select.select', function(e, item) {
        var id = _this.area.value.id;
        var longNumber = _this.area.value.longNumber;

        if (id == '-1') {
          _this.area.clearValue();
        } else {
          _this.trigger('fetchRegionList', { longNumber: longNumber });
        }

        _this.trigger('query');
      }).on('bs.select.clear', function() {
        _this.region.clearValue();
        _this.region.disable();
      });

      this.region = $('#region').select({
        placeholder: '全部片区',
        data: ['全部片区'],
      });
      $('#region').on('bs.select.select', function(e, item) {
        var id = _this.region.value.id;
        var longNumber = _this.region.value.longNumber;

        if (id == '-1') {
          _this.region.clearValue();
        } else {
          _this.trigger('fetchSubbranchList', { longNumber: longNumber });
        }
        _this.trigger('query');
      }).on('bs.select.clear', function() {
        _this.subbranch.clearValue();
        _this.subbranch.disable();
      });

      this.subbranch = $('#subbranch').select({
        placeholder: '全部分店',
        data: ['全部分店']
      });
      $('#subbranch').on('bs.select.select', function(e, item) {
        var id = _this.subbranch.value.id;
        var longNumber = _this.subbranch.value.longNumber;

        if (id == '-1') {
          _this.subbranch.clearValue();
        }
        _this.trigger('query');
      });

      this.startMonth = $('#startMonth').datepicker({
        minView: 'months',
        view: 'months',
        dateFormat: 'yyyy-mm'
      }).data('datepicker');
      this.endMonth = $('#endMonth').datepicker({
        minView: 'months',
        view: 'months',
        dateFormat: 'yyyy-mm'
      }).data('datepicker');
    },
    resetForm: function() {
      var _this = this;
      // 对当前级别的下拉设置默认值
      this[orgType[this.maxPermissionOrgType]].setValue(this.defaultCity);

      // 重置默认月份，和最大最小可选月份。
      var targetDate = new Date();
      this.startMonth.update({
        maxDate: new Date(targetDate.getFullYear(), targetDate.getMonth() - 1, 1),
        minDate: new Date(2016, 0, 1)
      });
      this.endMonth.update({
        maxDate: new Date(targetDate.getFullYear(), targetDate.getMonth() - 1, 1),
        minDate: new Date(2016, 0, 1)
      });
      targetDate.setMonth(targetDate.getMonth() - 2);
      this.startMonth.selectDate(targetDate);
      this.endMonth.selectDate(targetDate);
      this.startMonth.update({
        onSelect: function(formattedDate, date, inst) {
          _this.trigger('query');
        }
      });
      this.endMonth.update({
        onSelect: function(formattedDate, date, inst) {
          _this.trigger('query');
        }
      });
      $('#' + orgType[this.maxPermissionOrgType]).trigger('bs.select.select');
      //
      // this.area.clearValue();
      // this.area.disable();
    },
    queryParams: function() {
      var p = {};

      // 由于当前页面暂时不加楼盘相关查询，条件永远为假
      if (0 && this.garden.value) {
        p.type = 6;
        p.ids = this.garden.value.id;
      } else if (this.subbranch.value) {
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
      this.params = p;
    },
    renderEcharts: function() {
      this.refs.rank.trigger('initFecth', {
        qfang: {
          url: '/bi/marketing/org/rank/qfangDealRate.json',
          data: this.queryData()
        },
        company: {
          url: '/bi/marketing/org/rank/companyDealRateTop10.json',
          data: this.queryData()
        },
        other: {
          url: '/bi/marketing/org/rank/otherCompanyDealRateTop5.json',
          data: this.queryData()
        }
      });
    },
    query: function() {
      if (!this.startMonth.el.value.length) {
        alert('请选择开始月份!');
        this.startMonth.show();
        return false;
      }
      if (!this.endMonth.el.value.length) {
        alert('请选择结束月份!');
        this.endMonth.show();
        return false;
      }
      this.trigger('queryParams');
      this.trigger('renderEcharts');
    }
  },
  events: {
    'click #clear': 'clear',
    'click #export': 'export'
  },
  handle: {
    clear: function() {
      this.trigger('resetForm');
    },
    export: function() {
      location.href = '/bi/marketing/org/rank/exportCompanyDealRate.excel?' + $.param(this.queryData());
    }
  }
};
