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
    queryParams: function() {
      return {}
    },
    initForm: function() {
      var _this = this;
      this.city = $('#city').select({
        url: '/bi/common/orgList.json',
        placeholder: '城市',
        params: {
          orgType: 1
        },
        dataFormater: function(data) {
          return data.data;
        }
      }).render();
      $('#city').on('bs.select.select', function(e, item) {
        var id = _this.city.value.id;
        var longNumber = _this.city.value.longNumber;

        //组织类型： 1: 城市
        _this.params.parentOrgType = 1;
        _this.params.parentOrgIds = id;

        _this.district.option.params.parentLongNumbers = longNumber;
        _this.district.render();

        if (1 || _this.district.data.length) {
          $('#district').show();
          _this.district.enable();

          _this.area.clearValue();
          _this.area.disable();
        } else {
          $('#district').hide();
          _this.district.clearValue();
          _this.district.disable();

          _this.area.option.params.parentLongNumbers = longNumber;
          _this.area.render();
          _this.area.enable();

          _this.region.clearValue();
          _this.region.disable();
        }
      });

      this.district = $('#district').select({
        url: '/bi/common/orgList.json',
        placeholder: '全部大区',
        params: { orgType: 2 },
        highlight: true,
        dataFormater: function(data) {
          return data.data;
        }
      });
      $('#district').on('bs.select.select', function(e, item) {
        var id = _this.district.value.id;
        var longNumber = _this.district.value.longNumber;

        // 组织类型： 2: 大区
        _this.params.parentOrgType = 2;
        _this.params.parentOrgIds = id;

        _this.area.option.params.parentLongNumbers = longNumber;
        _this.area.render();
        _this.area.enable();

        _this.region.clearValue();
        _this.region.disable();
      }).on('bs.select.clear', function() {
        _this.area.clearValue();
        _this.area.disable();
      });

      this.area = $('#area').select({
        url: '/bi/common/orgList.json',
        placeholder: '全部区域',
        params: { orgType: 3 },
        dataFormater: function(data) {
          return data.data;
        }
      });
      $('#area').on('bs.select.select', function(e, item) {
        var id = _this.area.value.id;
        var longNumber = _this.area.value.longNumber;

        //组织类型： 3: 区域
        _this.params.parentOrgType = 3;
        _this.params.parentOrgIds = id;

        _this.region.option.params.parentLongNumbers = id;
        _this.region.render();

        _this.subbranch.clearValue();
      }).on('bs.select.clear', function() {
        _this.region.clearValue();
        _this.region.disable();
      });

      this.region = $('#region').select({
        url: '/bi/common/orgList.json',
        placeholder: '全部片区',
        params: { orgType: 4 },
        dataFormater: function(data) {
          return data.data;
        }
      });
      $('#region').on('bs.select.select', function(e, item) {
        var id = _this.region.value.id;
        var longNumber = _this.region.value.longNumber;

        //组织类型： 4: 片区
        _this.params.parentOrgType = 4;
        _this.params.parentOrgIds = id;

        _this.subbranch.option.params.parentLongNumbers = id;
        _this.subbranch.render();
      }).on('bs.select.clear', function() {
        _this.subbranch.clearValue();
        _this.subbranch.disable();
      });

      this.subbranch = $('#subbranch').select({
        url: '/bi/common/orgList.json',
        placeholder: '全部分店',
        params: { orgType: 5 },
        dataFormater: function(data) {
          return data.data;
        }
      });
      $('#subbranch').on('bs.select.select', function(e, item) {
        var id = _this.subbranch.value.id;
        var longNumber = _this.subbranch.value.longNumber;

        //组织类型： 5: 分店
        _this.params.parentOrgType = 5;
        _this.params.parentOrgIds = id;
      });


      this.datepicker = $('#selectedMonth').datepicker({
        minView: 'months',
        view: 'months',
        dateFormat: 'yyyy-mm'
      }).data('datepicker');
    },
    resetForm: function() {
      this.defaultCity = {
        "id": "1111",
        "name": "深圳",
        "longNumber": "298798987"
      };
      this.city.setValue(this.defaultCity);
      $('#city').trigger('bs.select.select');

      var targetDate = new Date();
      targetDate = new Date(targetDate.getFullYear(), targetDate.getMonth() - 3, 1);
      this.datepicker.selectDate(targetDate);
      this.datepicker.update({
        maxDate: targetDate
      });

    },
    mount: function() {
      this.trigger('initForm');
      this.trigger('resetForm');
      this.trigger('fetchOrgHouseRateStat');
      this.trigger('fetchOrgDealRateStat');
      this.trigger('renderTable');
    },
    // 报盘率图表
    fetchOrgHouseRateStat: function() {
      var _this = this;
      $.ajax({
        url: '/bi/marketing/orgHouseRateStatByMonth.json',
        dataType: 'JSON',
        data: $.extend({}, calcMonth($('#selectedMonth').val()))
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
        data: $.extend({}, calcMonth($('#selectedMonth').val()))
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
          width: 200
        }, {
          title: '有效报盘数',
          name: 'wsHouseCount',
          align: 'center',
          width: 100
        }, {
          title: '国土成交数',
          name: 'gtHouseCount',
          align: 'center',
          width: 100
        }, {
          title: '报盘率',
          name: 'houseRate',
          align: 'center',
          lockDisplay: true,
          width: 100,
          renderer: function(val, item, rowIndex) {
            return val + '%';
          }
        }, {
          title: '我司过户数',
          name: 'wsTransferCount',
          align: 'center',
          width: 100
        }, {
          title: '国土过户数',
          name: 'gtTransferCount',
          align: 'center',
          width: 100
        }, {
          title: '市占率',
          name: 'dealRate',
          align: 'center',
          width: 100,
          renderer: function(val, item, rowIndex) {
            return val + '%';
          }
        }],
        method: 'get',
        url: '/bi/marketing/statByOrg.json',
        params: function() {
          return $.extend({}, calcMonth($('#selectedMonth').val()), {
            parentOrgType: _this.params.parentOrgType,
            parentOrgIds: _this.params.parentOrgIds
          })
        },

        transform: function(res) {
          return res.data;
        },
        indexCol: true,
        fullWidthRows: true,
        showBackboard: false
      });
    },

    updated: function() {

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
      var params = $.param($.extend({}, calcMonth($('#selectedMonth').val()), {
        parentOrgType: this.params.parentOrgType,
        parentOrgIds: this.params.parentOrgIds
      }));
      location.href = '/bi/marketing/statByOrg.excel?' + params;
    }
  }
};
