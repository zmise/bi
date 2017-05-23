var coala = require('coala');
var config = require('config');
var tpl = require('./index.html');
var fillChartData = require('fillChartData');
require('./index.css');

var ec = require('echarts/echarts');
require('echarts/chart/line');
require('echarts/chart/bar');

var orgType = {
  1: 'city',
  2: 'district',
  3: 'area'
};

module.exports = {
  tpl: tpl,
  listen: {
    init: function() {
      // 缓存参数作查询和导出用
      this.params = {};
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
        _this.maxPermissionOrgType = res.data.maxPermissionOrgType;


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
      });

      this.datepicker = $('#selectedMonth').datepicker({
        minView: 'months',
        view: 'months',
        dateFormat: 'yyyy-mm'
      }).data('datepicker');
    },

    resetForm: function() {
      var _this = this;
      // 对当前级别的下拉设置默认值
      this[orgType[this.maxPermissionOrgType]].setValue(this.defaultCity);
      //
      this.area.clearValue();
      this.area.disable();

      // 重置默认月份，和最大最小可选月份。
      var targetDate = new Date();
      this.datepicker.update({
        maxDate: new Date(targetDate.getFullYear(), targetDate.getMonth() - 1, 1),
        minDate: new Date(2016, 0, 1)
      });
      targetDate.setMonth(targetDate.getMonth() - 2);
      this.datepicker.selectDate(targetDate);
      this.datepicker.update({
        onSelect: function(formattedDate, date, inst) {
          _this.trigger('query');
        }
      });

      $('#' + orgType[this.maxPermissionOrgType]).trigger('bs.select.select');
    },

    fecthDealRateCheck: function() {
      var _this = this;
      $.ajax({
        url: '/bi/orgCheck/dealRateCheck.json',
        data: {
          orgType: this.params.type,
          orgId: this.params.ids,
          checkMonth: this.datepicker.el.value
        }
      }).done(function(res) {
        if (res.status || !res.data) {

          _this.trigger('resetBeBox', 'dealRateCheck');
          return;
        }
        res.data.unit = '%';
        res.data.url = 'org.html';
        _this.trigger('renderBeBox', 'dealRateCheck', res.data);
      });
    },
    resetBeBox: function(domid) {
      var container = $('#' + domid);
      container.closest('.be-box').find('.bangzhu-box').hide();

      container.html('<div class="behave gray"> <div class="bh-score-box"></div> <p class="bh-desc">研发中…</p> </div> <p class="bh-sbox"></p>');
      container.next().empty();
    },
    renderBeBox: function(domid, data) {
      var container = $('#' + domid);
      var result = this.rateCheck(data.checkResultTypeValue);
      var behave = container.find('.behave');
      // 设置帮助提醒的浮动值
      container.closest('.be-box').find('.bangzhu-box').css('display', '').find('.js-float').text(data.floatCoefficient + data.unit);

      // 设置中间具体内容
      container.html('<div class="behave ' + result.behave + '"> <div class="bh-score-box"><span class="bh-score">' + data.realValue + '</span>' + data.unit + '</div> <p class="bh-desc">' + result.desc + '</p> </div> <p class="bh-sbox">考核指标：<span class="bh-setting">' + data.checkThreshold + data.unit + '</span></p>');

      container.next().html('<a class="be-btn" href="' + data.url + '">查看详情</a>');
    },

    renderBeBoxes: function() {
      this.trigger('fecthDealRateCheck');
    },

    queryParams: function() {
      var p = {};

      if (this.area.value) {
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
    query: function() {
      if (!this.datepicker.el.value.length) {
        alert('请选择月份!')
        this.datepicker.show();
        return false;
      }
      this.trigger('queryParams');
      this.trigger('renderBeBoxes');
    }
  },
  events: {
    'click #clear': 'clear'
  },
  handle: {
    clear: function() {
      this.trigger('resetForm');
    }
  },
  mixins: [{
    rateCheck: function(checkResult) {
      switch (checkResult) {
        case 1:
          return {
            behave: 'red',
            desc: '表现较差'
          };
        case 2:
          return {
            behave: 'yellow',
            desc: '需要注意'
          };
        case 3:
          return {
            behave: 'green',
            desc: '表现优异'
          };
      }
    }
  }]
};
