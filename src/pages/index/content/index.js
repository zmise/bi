var coala = require('coala');
var config = require('config');
var tpl = require('./index.html');
var summaryTpl = require('./summary.html');
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

      // this.trigger('fetchOrgHouseRateStat');
      // this.trigger('fetchOrgDealRateStat');
      // this.trigger('renderTable');
    },
    fetchDefaultCity: function() {
      var _this = this;
      $.ajax({
        url: '/bi/common/defaultCityOrg.json'
      }).done(function(res) {
        _this.defaultCity = res.data;
        _this.trigger('fetchCityList', { reset: true });
      });
    },
    fetchCityList: function(opt) {
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

        if (opt && opt.reset) {
          _this.trigger('fetchOrgHouseRateStat');
          _this.trigger('fetchOrgDealRateStat');
          _this.trigger('renderTable');
        }
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
        if (res.data.length) {
          $('#district').show();
          res.data.unshift({ id: "-1", name: "全部大区" });
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

        res.data.unshift({ id: "-1", name: "全部区域" });
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

        res.data.unshift({ id: "-1", name: "全部片区" });
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
        res.data.unshift({ id: "-1", name: "全部分店" });
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
        _this.params.type = 1;
        _this.params.ids = id;

        _this.trigger('fetchDistrictList', longNumber);

      });
      this.district = $('#district').select({
        placeholder: '全部大区',
        data: ['全部大区']
      });
      $('#district').on('bs.select.select', function(e, item) {
        var id = _this.district.value.id;
        var longNumber = _this.district.value.longNumber;

        if (id == '-1') {
          _this.area.clearValue();
        } else {
          _this.trigger('fetchAreaList', longNumber);
        }
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
          _this.trigger('fetchRegionList', longNumber);
        }
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
          _this.trigger('fetchSubbranchList', longNumber);
        }
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
      });

      // this.garden = $('#garden').select({
      //   search: true,
      //   url: '/bi/common/gardenList.json',
      //   placeholder: '输入楼盘名称',
      //   keyword: 'keyWord',
      //   params: { city: 'SHENZHEN' },
      //   //  function(){
      //   //   return {
      //   //     city: 'SHENZHEN' //_this.city.value.pinyin
      //   //   }
      //   // },
      //   dataFormater: function(data) {
      //     return data.data;
      //   }
      // });

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
      targetDate = new Date(targetDate.getFullYear(), targetDate.getMonth() - 2, 1);
      this.datepicker.selectDate(targetDate);
      this.datepicker.update({
        maxDate: targetDate,
        minDate: new Date(2016, 0, 1)
      });

    },
    // 报盘率图表
    fetchOrgHouseRateStat: function() {
      var _this = this;
      $.ajax({
        url: '/bi/marketing/orgHouseRateStatByMonth.json',
        dataType: 'JSON',
        data: {
          statMonth: _this.datepicker.el.value,
          type: _this.params.type,
          ids: _this.params.ids
        }
      }).done(function(res) {
        if (!res.data) {
          console.log('数据异常!')
          return false;
        }
        _this.trigger('fillChartData', res.data);

        var data = {
          el: 'dataChart0',
          x: {
            data: res.data.statMonthList,
            label: '统计月份'
          },
          y1: {
            data: res.data.rateList,
            label: '报盘率'
          },
          y2: {
            data: res.data.wsCountList,
            label: '有效报盘量'
          },
          y3: {
            data: res.data.gtCountList,
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
        data: {
          statMonth: _this.datepicker.el.value,
          type: _this.params.type,
          ids: _this.params.ids
        }
      }).done(function(res) {
        if (!res.data) {
          console.log('数据异常!')
          return false;
        }
        _this.trigger('fillChartData', res.data);

        var data = {
          el: 'dataChart1',
          x: {
            data: res.data.statMonthList,
            label: '统计月份'
          },
          y1: {
            data: res.data.rateList,
            label: '市占率'
          },
          y2: {
            data: res.data.wsCountList,
            label: '我司过户数量'
          },
          y3: {
            data: res.data.gtCountList,
            label: '国土过户数量'
          }
        };
        _this.trigger('renderChart', data);
      });
    },
    // 图表默认展示12个月的数据，对于不足的月份进行填充
    fillChartData: function(data) {
      var month = data.statMonthList;
      if (month.length < 12) {
        var diff = 12 - month.length;
        var firstDate = month[0];
        var m1 = new Date(firstDate);

        while (diff--) {
          m1.setMonth(m1.getMonth() - 1);;
          data.statMonthList.unshift(m1.getFullYear() + '-' + ('0' + (m1.getMonth() + 1)).substr(-2));
          data.wsCountList.unshift(undefined);
          data.gtCountList.unshift(undefined);
          data.rateList.unshift(undefined);
        }
      }
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
        //height: 360,
        cols: [{
          title: '名称',
          name: 'itemName',
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
          sortable: true,
          type: 'number'
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
          sortable: true,
          type: 'number'
        }],
        method: 'get',
        url: '/bi/marketing/statByOrg.json',
        params: function() {
          return {
            statMonth: _this.datepicker.el.value,
            type: _this.params.type,
            ids: _this.params.ids
          }
        },
        transform: function(res) {
          res.data.parallelList.length && _this.trigger('statistics', res.data.parallelList);
          if (res.data.subList.length) {
            return res.data.subList;
          } else {
            return false;
          }
        },
        indexCol: true,
        fullWidthRows: true,
        showBackboard: false
      }).on('loadSuccess', function(e, data) {
        _this.$('.nav-tabs .active a').trigger('click');
      });
    },
    statistics: function(data) {
      $('#statistics').html(summaryTpl(data[0]));

      var $mmHead = $('.mmg-head th');
      var statTd = $('#statistics').find('table td');
      for (var i = $mmHead.length - 1; i >= 0; i--) {
        statTd.eq(i).width($mmHead.eq(i).width() - 2);
      }
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
    sortColumn: function(e) {
      var selectedIndex = $(e.currentTarget).data('index');
      var $title = $('.mmg-head th:eq(' + selectedIndex + ') .mmg-title');

      // 强制设置当前排序方式为升序，以便触发点击后永远以降序排序。
      $.data($title[0], 'sortStatus', 'asc');
      $title.trigger('click');

      $index = this.list.$body.find('.mmg-index');
      for (var i = $index.length; i > 0; i--) {
        $index.eq(i - 1).text(i);
      }
      $('.mmg-bodyWrapper').scrollTop(0);
    }
  },
  events: {
    'click #query': 'query',
    'click #clear': 'clear',
    'click #export': 'export',
    'click .nav-tabs a': 'sortColumn'
  },
  handle: {
    query: function(e) {
      e.currentTarget.blur();
      if (!this.datepicker.el.value.length) {
        alert('请选择月份!')
        this.datepicker.show();
        return false;
      }
      this.trigger('queryParams');
      this.trigger('fetchOrgHouseRateStat');
      this.trigger('fetchOrgDealRateStat');
      this.list.load();
    },
    clear: function() {
      this.trigger('resetForm');
    },
    export: function() {
      var params = {
        statMonth: this.datepicker.el.value,
        type: this.params.type,
        ids: this.params.ids
      };
      location.href = '/bi/marketing/statByOrg.excel?' + $.param(params);
    },
    sortColumn: function(e) {
      this.trigger('sortColumn', e);
    }
  }
};
