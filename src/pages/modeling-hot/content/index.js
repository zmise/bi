var coala = require('coala');
var ec = require('echarts/echarts');
require('echarts/chart/line');
require('echarts/chart/bar');

var config = require('config');
var tpl = require('./index.html');
var pageTpl = require('./pages.html');
require('./index.css');

module.exports = {
  tpl: tpl,
  listen: {
    init: function() {
      // 缓存参数作查询和导出用
      this.params = {};
      this.config = {
        pageSize: 30,
        currentPage: 1
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
        if (res.status !== 0) {
          console.warn('数据异常！');
          return false;
        }
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
        if (res.status !== 0) {
          console.warn('数据异常！');
          return false;
        }
        _this.city.option.data = res.data;
        _this.city.render();

        _this.trigger('resetForm');

        if (opt && opt.reset) {
          _this.trigger('queryParams');
          _this.trigger('renderTable');
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
        if (res.status !== 0) {
          console.warn('数据异常！');
          return false;
        }

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
        if (res.status !== 0) {
          console.warn('数据异常！');
          return false;
        }

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
    // 列表渲染
    renderTable: function(data) {
      var _this = this;
      this.list = $('#tableGrid').table({
        cols: [{
          title: '排名',
          name: 'place',
          align: 'center',
          width: 60,
          lockWidth: true
        }, {
          title: '楼盘名称',
          name: 'gardenName',
          align: 'center',
          width: 270,
          lockWidth: true
        }, {
          title: '所属片区',
          name: 'subAreaName',
          align: 'center',
          width: 140,
          lockWidth: true
        }, {
          title: '所属区域',
          name: 'areaName',
          align: 'center',
          width: 140,
          lockWidth: true
        }, {
          title: '全市过户数',
          name: 'gtTransferCount',
          align: 'center',
          width: 140,
          lockWidth: true
        }, {
          title: '我司过户量',
          name: 'wsTransferCount',
          align: 'center',
          lockDisplay: true,
          width: 140,
          lockWidth: true
        }, {
          title: '我司市占',
          name: 'dealRate',
          align: 'center',
          width: 100,
          lockWidth: true,
          renderer: function(val, item, rowIndex) {
            return val + '%';
          }
        }],
        method: 'get',
        url: '/bi/marketing/model/heat/gardens.json',
        params: function() {
          return {
            startMonth: _this.startMonth.el.value,
            endMonth: _this.endMonth.el.value,
            entityType: _this.params.type,
            entityId: _this.params.ids,
            currentPage: _this.config.currentPage,
            pageSize: _this.config.pageSize
          }
        },
        transform: function(res) {
          if (res.status !== 0) {
            console.warn('数据异常！');
            return false;
          }

          _this.config.pageCount = res.data.pageCount || 1;
          _this.config.total = res.data.total;
          _this.trigger('tablepage', res.data);
          return res.data.itemList;
        },

        height: window.innerHeight - $('#tableGrid').offset().top - 70,
        noDataText: '',
        showBackboard: false
      }).on('loadSuccess', function(e, data) {
        $(this).parent().removeClass('table-no-data');
        $(this).closest('.mmGrid').find('th:eq(0) .mmg-title').text('排名');
        !data && $(this).parent().addClass('table-no-data');
        _this.$('.nav-tabs .active a').trigger('click');
      });
    },
    tablepage: function(data) {
      data.currentPage = this.config.currentPage;
      $('#tablepage').html(pageTpl(data)).show();
    },
    queryParams: function() {
      var p = {};
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
    query: function(e) {
      if (!this.list) {
        return false;
      }
      if (!this.startMonth.el.value.length) {
        alert('请选择开始月份!')
        this.startMonth.show();
        return false;
      }
      if (!this.endMonth.el.value.length) {
        alert('请选择结束月份!')
        this.endMonth.show();
        return false;
      }

      this.trigger('queryParams');
      this.config.currentPage = 1;
      this.list.load();
      this.trigger('tablepage', []);
    }
  },
  events: {
    'click #clear': 'clear',
    'click #export': 'export',
    'click .pagebox a': 'sendpage'
  },
  handle: {
    clear: function() {
      this.trigger('resetForm');
    },
    export: function() {
      var params = {
        startMonth: this.startMonth.el.value,
        endMonth: this.endMonth.el.value,
        entityType: this.params.type,
        entityId: this.params.ids
      };

      location.href = '/bi/marketing/model/heat/exportGardens.json?' + $.param(params);
    },
    sendpage: function(e) {
      var action = $(e.currentTarget).data('action');
      var currentPage = this.config.currentPage;
      var pageCount = this.config.pageCount;
      if(pageCount === 1){
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
