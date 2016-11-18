var coala = require('coala');
var config = require('config');
var tpl = require('./index.html');
require('./index.css');

var ec = require('echarts/echarts');
require('echarts/chart/line');
require('echarts/chart/bar');

function calcMonth(month) {
  var m1 = new Date(month + '-1');
  var m2 = new Date(m1.getFullYear(), m1.getMonth() - 11, 1);
  m2 = m2.getFullYear() + "-" + (m2.getMonth() + 1);

  return {
    startStatMonth: month,
    endStatMonth: m2
  }
}

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

      this.trigger('fetchOrgHouseRateStat');
      this.trigger('fetchOrgDealRateStat');
      this.trigger('renderTable');
    },
    fetchDefaultCity: function() {
      var _this = this;
      $.ajax({
        url: '/bi/common/defaultCityOrg.json'
      }).done(function(res) {
        _this.defaultCity = res.data[0];
        _this.trigger('fetchCityList');
      });
    },
    fetchCityList: function() {
      var _this = this;
      $.ajax({
        url: '/bi/common/orgList.json',
        data: {
          orgType: 1
        }
      }).done(function(res) {
        _this.city.option.data = res.data;
        _this.city.render();

        _this.trigger('resetForm');
      });
    },
    fetchDistrictList: function(longNumber) {
      var _this = this;
      $.ajax({
        url: '/bi/common/orgList.json',
        data: {
          orgType: 2,
          parentLongNumbers: longNumber
        }
      }).done(function(res) {
        //res.data = [];
        if (res.data.length) {
          $('#district').show();
          _this.district.option.data = res.data;
          _this.district.render();
          _this.district.enable();

          _this.area.clearValue();
          _this.area.disable();
        } else {

          $('#district').hide();
          _this.district.clearValue();
          _this.district.disable();

          _this.trigger('fetchAreaList', longNumber);
        }

      });
    },
    fetchAreaList: function(longNumber) {
      var _this = this;
      $.ajax({
        url: '/bi/common/orgList.json',
        data: {
          orgType: 3,
          parentLongNumbers: longNumber
        }
      }).done(function(res) {

        _this.area.option.data = res.data;
        _this.area.render();
        _this.area.enable();

        _this.region.clearValue();
        _this.region.disable();
      });
    },
    fetchRegionList: function(longNumber) {
      var _this = this;
      $.ajax({
        url: '/bi/common/orgList.json',
        data: {
          orgType: 4,
          parentLongNumbers: longNumber
        }
      }).done(function(res) {

        _this.region.option.data = res.data;
        _this.region.render();

        _this.subbranch.clearValue();
        _this.subbranch.disable();
      });
    },
    fetchSubbranchList: function(longNumber) {
      var _this = this;
      $.ajax({
        url: '/bi/common/orgList.json',
        data: {
          orgType: 5,
          parentLongNumbers: longNumber
        }
      }).done(function(res) {
        _this.subbranch.option.data = res.data;
        _this.subbranch.render();
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
        _this.params.parentOrgType = 1;
        _this.params.parentOrgIds = id;

        _this.trigger('fetchDistrictList', longNumber);

      });
      this.district = $('#district').select({
        placeholder: '全部大区',
        data: ['全部大区']
      });
      $('#district').on('bs.select.select', function(e, item) {
        var id = _this.district.value.id;
        var longNumber = _this.district.value.longNumber;

        // 组织类型： 2: 大区
        _this.params.parentOrgType = 2;
        _this.params.parentOrgIds = id;

        _this.trigger('fetchAreaList', longNumber);

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

        //组织类型： 3: 区域
        _this.params.parentOrgType = 3;
        _this.params.parentOrgIds = id;

        _this.trigger('fetchRegionList', longNumber);

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

        //组织类型： 4: 片区
        _this.params.parentOrgType = 4;
        _this.params.parentOrgIds = id;

        _this.trigger('fetchSubbranchList', longNumber);

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

        //组织类型： 5: 分店
        _this.params.parentOrgType = 5;
        _this.params.parentOrgIds = id;
      });

      this.garden = $('#garden').select({
        search: true,
        url: '/bi/common/gardenList.json',
        placeholder: '输入楼盘名称',
        keyword: 'keyWord',
        params: { city: 'SHENZHEN' },
        //  function(){
        //   return {
        //     city: 'SHENZHEN' //_this.city.value.pinyin
        //   }
        // },
        dataFormater: function(data) {
          return data.data;
        }
      });

      this.datepicker = $('#selectedMonth').datepicker({
        minView: 'months',
        view: 'months',
        dateFormat: 'yyyy-mm'
      }).data('datepicker');
    },
    resetForm: function() {
      this.city.setValue(this.defaultCity);
      $('#city').trigger('bs.select.select');

      var targetDate = new Date();
      targetDate = new Date(targetDate.getFullYear(), targetDate.getMonth() - 3, 1);
      this.datepicker.selectDate(targetDate);
      this.datepicker.update({
        maxDate: targetDate
      });

    },
    // 报盘率图表
    fetchOrgHouseRateStat: function() {
      var _this = this;
      $.ajax({
        url: '/bi/marketing/orgHouseRateStatByMonth.json',
        dataType: 'JSON',
        data: $.extend({},
          calcMonth($('#selectedMonth').val()), {
            orgType: _this.params.parentOrgType,
            orgIds: _this.params.parentOrgIds
          })
      }).done(function(res) {
        var data = {
          el: 'dataChart0',
          x: {
            data: res.data.statMonth,
            label: '统计月份'
          },
          y1: {
            data: res.data.houseRate,
            label: '报盘率'
          },
          y2: {
            data: res.data.wsHouseCount,
            label: '有效报盘量'
          },
          y3: {
            data: res.data.gtHouseCount,
            label: '国土成交量'
          }
        };
        _this.trigger('renderChart', data);
      });
    },
    // 市占率图表
    fetchOrgDealRateStat: function() {
      var _this = this;
      $.ajax({
        url: '/bi/marketing/orgDealRateStatByMonth.json',
        dataType: 'JSON',
        data: $.extend({},
          calcMonth($('#selectedMonth').val()), {
            orgType: _this.params.parentOrgType,
            orgIds: _this.params.parentOrgIds
          })
      }).done(function(res) {
        var data = {
          el: 'dataChart1',
          x: {
            data: res.data.statMonth,
            label: '统计月份'
          },
          y1: {
            data: res.data.dealRate,
            label: '市占率'
          },
          y2: {
            data: res.data.wsTransferCount,
            label: '我司过户数量'
          },
          y3: {
            data: res.data.gtTransferCount,
            label: '国土过户数量'
          }
        };
        _this.trigger('renderChart', data);
      });
    },
    // 图表渲染
    renderChart: function(data) {
      var option = {
        backgroundColor: '#fff',
        noDataLoadingOption: {
          text: '暂无数据',
          effect: 'whirling'
        },
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            lineStyle: {
              color: '#f60'
            }
          },
          padding: 10,
          textStyle: {
            fontSize: 14,
            color: '#fff'
          },
          formatter: function(data) {
            return data[0][1] + '<br/>' + data[1][0] + '：' + data[1][2] + '<br>' + data[2][0] + '：' + data[2][2] + '<br>' + data[0][0] + '：' + data[0][2] + '%';
          }
        },
        /*grid: {
          x: 90,
          x2: 70,
          y2: 100
        },*/
        color: ['#f91', '#ffa227', '#9c6'],
        calculable: false,
        legend: {
          x: '90',
          y: 5,
          itemGap: 25,
          itemWidth: 25,
          itemHeight: 16,
          borderWidth: 0,
          textStyle: {
            fontSize: 14
          },
          data: [data.y1.label, data.y2.label, data.y3.label]
        },
        xAxis: [{
          axisLine: {
            lineStyle: {
              width: 1,
              color: '#aeaeae'
            }
          },
          axisLabel: {
            textStyle: {
              fontSize: 14,
              color: '#333'
            }
          },
          data: data.x.data,
          splitLine: {
            show: false
          }
        }],
        yAxis: [{
          /*min: 1000,
          max: 8000,
          scale: 1000,
          splitNumber: 7,*/
          axisLabel: {
            formatter: function(a) {
              return a;
            },
            textStyle: {
              fontSize: 14,
              color: '#333'
            }
          },
          axisLine: {
            lineStyle: {
              width: 1,
              color: '#aeaeae'
            }
          },
          splitArea: {
            show: false
          }
        }, {
          /*min: 100,
          max: 800,*/
          // scale: 100,
          // splitNumber: 7,
          axisLabel: {
            formatter: function(a) {
              return a + '%';
            },
            textStyle: {
              fontSize: 14,
              color: '#333'
            }
          },
          axisLine: {
            lineStyle: {
              width: 1,
              color: '#aeaeae'
            }
          },
          splitArea: {
            show: false
          }
        }],
        series: [{
          name: data.y1.label,
          type: 'line',
          yAxisIndex: 1,
          z: '1',
          symbol: 'circle',
          smooth: true,
          itemStyle: {
            normal: {
              areaStyle: {
                color: 'rgba(255,230,196,.15)',
                type: 'default'
              }
            }
          },
          data: data.y1.data
        }, {
          name: data.y2.label,
          type: 'bar',
          barWidth: 15,
          barCategoryGap: '44',
          yAxisIndex: 0,
          itemStyle: {
            normal: {
              barBorderRadius: 0
            },
            lineStyle: {
              type: 'dotted'
            }
          },
          data: data.y2.data
        }, {
          name: data.y3.label,
          type: 'bar',
          barWidth: 15,
          yAxisIndex: 0,
          itemStyle: {
            normal: {
              barBorderRadius: 0
            },
            lineStyle: {
              type: 'dotted'
            }
          },
          data: data.y3.data
        }]
      }

      $('#' + data.el).addClass('chart-box').width($('.tab-content').width());
      var myChart = ec.init(document.getElementById(data.el), 'macarons');
      myChart.setOption(option);
      $('#' + data.el).removeClass('chart-box');
    },

    // 列表渲染
    renderTable: function(data) {
      var _this = this;
      this.list = $('#list').table({
        cols: [{
          title: '名称',
          name: 'orgName',
          align: 'center',
          width: 200,
          lockWidth: true
        }, {
          title: '有效报盘数',
          name: 'wsHouseCount',
          align: 'center',
          width: 100,
          lockWidth: true
        }, {
          title: '国土成交数',
          name: 'gtHouseCount',
          align: 'center',
          width: 100,
          lockWidth: true
        }, {
          title: '报盘率',
          name: 'houseRate',
          align: 'center',
          lockDisplay: true,
          width: 100,
          lockWidth: true,
          renderer: function(val, item, rowIndex) {
            return val + '%';
          }
        }, {
          title: '我司过户数',
          name: 'wsTransferCount',
          align: 'center',
          width: 100,
          lockWidth: true
        }, {
          title: '国土过户数',
          name: 'gtTransferCount',
          align: 'center',
          width: 100,
          lockWidth: true
        }, {
          title: '市占率',
          name: 'dealRate',
          align: 'center',
          width: 100,
          lockWidth: true,
          renderer: function(val, item, rowIndex) {
            return val + '%';
          }
        }],
        method: 'get',
        url: '/bi/marketing/statByOrg.json',
        params: function() {
          return {
            statMonth: $('#selectedMonth').val(),
            parentOrgType: _this.params.parentOrgType,
            parentOrgIds: _this.params.parentOrgIds
          }
        },
        transform: function(res) {
          _this.trigger('statistics', res.data);
          return res.data;
        },
        indexCol: true,
        fullWidthRows: true,
        showBackboard: false
      });
    },
    statistics: function(data) {
      console.log(data)

    }
  },
  events: {
    'click #query': 'query',
    'click #clear': 'clear',
    'click #export': 'export'
  },
  handle: {
    query: function() {
      this.trigger('fetchOrgHouseRateStat');
      this.trigger('fetchOrgDealRateStat');
      this.list.load();
    },
    clear: function() {
      this.trigger('resetForm');
    },
    export: function() {
      var params = {
        statMonth: $('#selectedMonth').val(),
        parentOrgType: this.params.parentOrgType,
        parentOrgIds: this.params.parentOrgIds
      };
      location.href = '/bi/marketing/statByOrg.excel?' + params;
    }
  }
};
