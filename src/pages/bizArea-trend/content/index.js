var coala = require('coala');
var config = require('config');
var tpl = require('./index.html');
var trend = require('components/trend');
require('./index.css');

module.exports = {
  tpl: tpl,
  refs: {
    trend: {
      component: trend,
      el: '#main'
    }
  },
  listen: {
    init: function() {
      // 缓存参数作查询和导出用
      this.params = {};
      this.queryData = function() {
        return {
          month: this.datepicker.el.value,
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
        url: '/bi/common/defaultCity.json'
      }).done(function(res) {
        _this.defaultCity = res.data;
        _this.trigger('fetchCityList', { reset: true });
      });
    },
    fetchCityList: function(opt) {
      var _this = this;
      $.ajax({
        url: '/bi/common/areaList.json',
        data: {
          areaType: 1
        }
      }).done(function(res) {
        _this.city.option.data = res.data;
        _this.city.render();

        _this.trigger('resetForm');

        if (opt && opt.reset) {
          _this.trigger('queryParams');
        }
      });
    },
    fetchAreaList: function(id) {
      this.area.clearValue();
      this.area.disable();
      var _this = this;
      $.ajax({
        url: '/bi/common/areaList.json',
        data: {
          areaType: 2,
          parentIds: id
        }
      }).done(function(res) {

        res.data.unshift({ id: "-1", name: "全部区域" });
        _this.area.option.data = res.data;
        _this.area.render();
        _this.area.enable();

        _this.bizArea.clearValue();
        _this.bizArea.disable();
      });
    },
    fetchBizAreaList: function(id) {
      this.bizArea.clearValue();
      this.bizArea.disable();
      var _this = this;
      $.ajax({
        url: '/bi/common/bizAreaList.json',
        data: {
          parentAreaIds: id
        }
      }).done(function(res) {

        res.data.unshift({ id: "-1", name: "全部商圈" });
        _this.bizArea.option.data = res.data;
        _this.bizArea.render();
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
        _this.trigger('fetchAreaList', id);
        _this.trigger('query');
      });

      this.area = $('#area').select({
        placeholder: '全部区域',
        data: ['全部区域']
      });
      $('#area').on('bs.select.select', function(e, item) {
        var id = _this.area.value.id;
        if (id == '-1') {
          _this.area.clearValue();
        } else {
          _this.trigger('fetchBizAreaList', id);
        }
        _this.trigger('query');
      }).on('bs.select.clear', function() {
        _this.bizArea.clearValue();
        _this.bizArea.disable();
      });

      this.bizArea = $('#bizArea').select({
        placeholder: '全部商圈',
        data: ['全部商圈'],
      });
      $('#bizArea').on('bs.select.select', function(e, item) {
        var id = _this.bizArea.value.id;
        if (id == '-1') {
          _this.bizArea.clearValue();
        }
        _this.trigger('query');
      }).on('bs.select.clear', function() {

      });

      this.datepicker = $('#dateMonth').datepicker({
        minView: 'months',
        view: 'months',
        dateFormat: 'yyyy-mm'
      }).data('datepicker');
    },
    resetForm: function() {
      var _this = this;
      this.city.setValue(this.defaultCity);

      var targetDate = new Date();
      this.datepicker.update({
        maxDate: new Date(targetDate.getFullYear(), targetDate.getMonth() - 1, 1),
        minDate: new Date(2016, 0, 1)
      });
      targetDate.setMonth(targetDate.getMonth() - 2);
      this.datepicker.selectDate(targetDate);

      // 选择默认值后设置
      this.datepicker.update({
        onSelect: function(formattedDate, date, inst) {
          _this.trigger('query');
        }
      });

      $('#city').trigger('bs.select.select');
    },
    renderEcharts: function() {
      this.refs.trend.trigger('fetchCompanyDealRateStat', {
        url: '/bi/marketing/biz/trend/otherCompanyDealRateTop3.json',
        data: this.queryData()
      });
      this.refs.trend.trigger('fetchOtherDealRateStat', {
        url: '/bi/marketing/biz/trend/gtTransferCount.json',
        data: this.queryData()
      });
    },
    queryParams: function() {
      var p = {
        order: $('.nav-tabs .active a').data('order')
      };
      if (this.garden && this.garden.value) {
        p.type = 4;
        p.ids = this.garden.value.id;
        //p.parentId = this.
      } else if (this.bizArea.value) {
        p.type = 3;
        p.ids = this.bizArea.value.id;
        p.parentId = this.area.value.id;
      } else if (this.area.value) {
        p.type = 2;
        p.ids = this.area.value.id;
        p.parentId = this.city.value.id;
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
      this.trigger('renderEcharts');
    }
  },
  events: {
    // 'click #query': 'query',
    'click #clear': 'clear',
    'click #export': 'export'
  },
  handle: {
    clear: function() {
      this.trigger('resetForm');
    },
    export: function() {
      location.href = '/bi/marketing/biz/trend/exportCompanyDealRate.excel?' + $.param(this.queryData());
    }
  }
};
