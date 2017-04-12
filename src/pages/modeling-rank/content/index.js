var coala = require('coala');
var config = require('config');
var tpl = require('./index.html');
require('./index.css');
var rank = require('components/rank');


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

        _this.region.clearValue();
        _this.region.disable();
      });
    },
    fetchRegionList: function(id) {
      this.region.clearValue();
      this.region.disable();
      var _this = this;
      $.ajax({
        url: '/bi/common/areaList.json',
        data: {
          areaType: 3,
          parentIds: id
        }
      }).done(function(res) {

        res.data.unshift({ id: "-1", name: "全部片区" });
        _this.region.option.data = res.data;
        _this.region.render();
        _this.region.enable();
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
          _this.trigger('fetchRegionList', id);
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
        if (id == '-1') {
          _this.region.clearValue();
        } else {
          _this.trigger('fetchSubbranchList', id);
        }

        _this.trigger('query');
      }).on('bs.select.clear', function() {

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
      this.city.setValue(this.defaultCity);
      //
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

      $('#city').trigger('bs.select.select');
    },
    queryParams: function() {
      var p = {
        // order: $('.nav-tabs .active a').data('order')
      };
      if (this.garden && this.garden.value) {
        p.type = 4;
        p.ids = this.garden.value.id;
      } else if (this.region.value) {
        p.type = 3;
        p.ids = this.region.value.id;
      } else if (this.area.value) {
        p.type = 2;
        p.ids = this.area.value.id;
      } else if (this.city.value) {
        p.type = 1;
        p.ids = this.city.value.id;
      }
      this.params = p;
    },
    renderEcharts: function() {
      this.refs.rank.trigger('initFecth', {
        qfang: {
          url: '/bi/marketing/model/rank/qfangDealRate.json',
          data: this.queryData()
        },
        company: {
          url: '/bi/marketing/model/rank/companyDealRateTop10.json',
          data: this.queryData()
        },
        other: {
          url: '/bi/marketing/model/rank/otherCompanyDealRateTop5.json',
          data: this.queryData()
        }
      });
    },
    query: function(e) {
      // e.currentTarget.blur();
      // debugger;
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
      // var params = {
      //   orderField: this.params.order, //1报盘率，2市占率
      //   orderType: 2, //1升序，2降序
      //   statMonth: this.datepicker.el.value,
      //   type: this.params.type,
      //   ids: this.params.ids
      // };
      location.href = '/bi/marketing/model/rank/exportCompanyDealRate.excel?' + $.param(this.queryData());
    }
  }
};
