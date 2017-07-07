var coala = require('coala');
var ec = require('echarts/echarts');
require('echarts/chart/line');

var config = require('config');
var tpl = require('./index.html');
require('./index.css');
var staticsisHTML = require('./staticsis.html');

module.exports = {
  tpl: tpl,
  listen: {

    // 获取默认值
    fetchDefaultCity: function () {
      var _this = this;
      $.ajax({
        url: '/bi/common/defaultCity.json'
      }).done(function (res) {
        _this.defaultCity = res.data;
        _this.trigger('fetchCityList');
      });
    },

    // 获取城市列表
    fetchCityList: function (opt) {
      var _this = this;
      $.ajax({
        url: '/bi/common/areaList.json',
        data: {
          areaType: 1
        }
      }).done(function (res) {
        _this.city.option.data = res.data;
        _this.city.render();

        // 重置表单
        _this.trigger('resetForm');
        _this.trigger('initFormEvent');

        // 触发查询请求
        $('#city').trigger('bs.select.select');
      });
    },

    // 获取趋势图数据
    fetchTrend: function () {
      var _this = this;
      $.ajax({
        url: '/bi/marketing/lastestYearCityHousePriceConfidenceIndicesStat.json',
        data: {
          statMonth: _this.dateMonth.el.value,
          cityId: _this.city.value.id
        }
      }).done(function (res) {
        var len = res.data.length;
        var data = {
          xvalue: [],//'2016-06', '2016-07', '2016-08', '2016-09', '2016-10', '2016-11', '2016-12', '2017-01', '2017-02', '2017-03', '2017-04', '2017-05'
          value: [],//100.1, 100.3, 100.3, 100.5, 100.6, 100.8, 101.1, 101.9, 107.4, 110.5, 106.6, 108.4
          basevalue: []//100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100
        };

        for (var i = 0; i < len; i++) {
          var item = res.data[i];
          data.xvalue.push(item.statMonth);
          data.value.push(item.confidenceIndices.toFixed(1));
          data.basevalue.push(item.baseConfidenceIndices);
        }

        _this.trigger('renderTrend', data);
      });
    },

    // 获取信心指数具体数据
    fetchData: function () {
      var _this = this;
      $.ajax({
        url: '/bi/marketing/cityHousePriceConfidenceIndicesStat.json',
        data: {
          statMonth: _this.dateMonth.el.value,
          cityId: _this.city.value.id
        }
      }).done(function (res) {
        var data = res.data[0];
        var cfd = data.confidenceIndices;
        data.confidenceIndices = data.confidenceIndices.toFixed(1);
        if (cfd > 100) {
          data.class = 'glyphicon-arrow-up';
        } else if (cfd < 100) {
          data.class = 'glyphicon-arrow-down';
        } else {
          data.class = 'glyphicon-minus';
        }
        _this.trigger('renderStaticsis', data);
      });
    },

    mount: function () {
      this.trigger('initForm');
      this.trigger('fetchDefaultCity');
    },

    // 初始化表单
    initForm: function () {
      var _this = this;
      this.city = $('#city').select({
        placeholder: '城市',
        data: ['城市']
      });

      this.dateMonth = $('#dateMonth').datepicker({
        minView: 'months',
        view: 'months',
        dateFormat: 'yyyy-mm'
      }).data('datepicker');
    },

    // 表单默认值
    resetForm: function () {
      this.city.setValue(this.defaultCity);

      // 重置默认月份，和最大最小可选月份。
      var targetDate = new Date();
      this.dateMonth.update({
        maxDate: new Date(targetDate.getFullYear(), targetDate.getMonth() - 1, 1),
        minDate: new Date(2016, 0, 1)
      });

      targetDate.setMonth(targetDate.getMonth() - 2);
      this.dateMonth.selectDate(targetDate);
    },

    // 设置监听事件
    initFormEvent: function () {
      var _this = this;
      $('#city').on('bs.select.select', function (e, item) {
        _this.trigger('query');
      });

      this.dateMonth.update({
        onSelect: function (formattedDate, date, inst) {
          _this.trigger('query');
        }
      });
    },

    renderStaticsis: function (data) {
      this.$('#staticsis').html(staticsisHTML(data));
    },

    // 渲染趋势图
    renderTrend: function (data) {
      var option = {
        grid: {
          y: 30,
          y2: 40,
          x2: 40,
          borderWidth: 0
        },
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            lineStyle: {
              color: '#e3e3e3',
              width: 1
            }
          },
          formatter: function (p, r, v) {
            return p[0].name + '<br>' + p[0].seriesName + ' : ' + p[0].data + '<br>' + p[1].seriesName + ' : ' + p[1].data;
          }
        },
        xAxis: [{
          type: 'category',
          axisLine: {
            lineStyle: {
              color: '#e3e3e3',
              width: 1
            }
          },
          axisTick: {
            lineStyle: {
              color: '#e3e3e3'
            }
          },
          splitLine: {
            show: false
          },
          data: data.xvalue
        }],
        yAxis: [{
          axisLine: {
            lineStyle: {
              color: '#e3e3e3',
              width: 1
            }
          },
          axisTick: {
            show: true,
            lineStyle: {
              color: '#e3e3e3'
            }
          },
          splitLine: {
            lineStyle: {
              color: '#e3e3e3',
              type: 'dashed'
            }
          },
          splitArea: {
            show: false
          },
          scale: true,
          boundaryGap: [0.2, 0.2],
          type: 'value'
        }],
        series: [{
          name: '房价市场信心指数',
          type: 'line',
          smooth: true,
          symbolSize: 4,
          data: data.value
        }, {
          name: '信心基数',
          type: 'line',
          symbol: 'none',
          itemStyle: {
            normal: {
              lineStyle: {
                type: 'dashed'
              }
            }
          },
          data: data.basevalue
        }]
      };

      // console.log(option);
      var myChart = ec.init(document.getElementById('cfdTrend'));
      myChart.setOption(option);
    },

    // 查询事件
    query: function () {
      if (!this.dateMonth.el.value.length) {
        alert('请选择月份!');
        this.dateMonth.show();
        return false;
      }
      this.trigger('fetchData');
      this.trigger('fetchTrend');
    }
  },
  events: {
    'click #clear ': 'clear'
  },
  handle: {
    clear: function (e) {
      this.trigger('resetForm');
    }
  }
};
