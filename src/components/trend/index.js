var coala = require('coala');
var config = require('config');
var tpl = require('./index.html');
var trendListTpl = require('./trendList.html');
require('./index.css');
require('assets/img/circle.png');
require('assets/vendors/iconfont/iconfont.css');

var ec = require('echarts/echarts');
require('echarts/chart/line');
require('echarts/chart/bar');

var colors = ['#ff7611', '#008de4', '#17bd8a', '#c81bcc'];

module.exports = {
  tpl: tpl,
  listen: {
    // 趋势对比
    fetchCompanyDealRateStat: function(opt) {
      var _this = this;
      $.ajax({
        url: opt.url,
        dataType: 'JSON',
        data: opt.data
      }).done(function(res) {
        if (res.status != 0) {
          console.log('数据异常!')
          return false;
        }

        if (!res.data.qfangTrend) {
          // 没有数据
          $('#dataChart1').empty();
          $('#trendList').empty();
          $('#dataChart1').parent().parent().addClass('no-datas');
          return false;
        }

        $('#dataChart1').parent().parent().removeClass('no-datas');
        $('#trendList').html(trendListTpl(res.data));

        // 缓存我司&前3公司市占趋势
        _this.companyDealRate = res.data.otherCompanyTrend.slice(0);
        _this.companyDealRate.unshift(res.data.qfangTrend);
        _this.companyDealRate.monthList = res.data.monthList;
        _this.trigger('renderCompanyChart');
      });
    },
    // 趋势对比数据处理
    formatCompanyDealRate: function(data) {
      var len;
      var i = 0;
      var _this = this;
      var list = $('#trendList .selected');
      var colorsi = ['#ffc7c7', '#6cd46c'];
      var min = [];
      var max = [];
      data.color = [];
      data.series = [];
      data.legend = [];
      len = list.length;
      for (; i < len; i++) {
        var obj = list[i];
        var index = $(obj).index();
        var tempdata = _this.companyDealRate[index];
        var temp = tempdata.dealRateList.slice(1);
        data.color.push(colors[index]);
        data.legend.push(tempdata.companyName);

        temp.splice(12);
        data.series.push({
          name: tempdata.companyName,
          type: 'line',
          zlevel: 4,
          data: temp
        });
        min.push(Math.min.apply(null, temp));
        max.push(Math.max.apply(null, temp));
      }
      // 设置最大最小值 +- 0.2
      data.min = ((Math.min.apply(null, min)) * 0.9).toFixed(2);
      data.max = ((Math.max.apply(null, max)) * 1.1).toFixed(2);
      if (list.length === 1) {
        data.tformatter = function(p, r, v) {
          p = p[0];
          var tempdata = _this.companyDealRate[$('#trendList .selected').index()].transferCountList;
          var index = p.dataIndex + 1;
          var prev = tempdata[index - 1];
          var now = tempdata[index];
          var status = now >= prev;
          var dealRate = prev > 0 ? Math.abs(((now - prev) / prev * 100).toFixed(2)) : 0;
          var _html = '<div class="trend-tips"><div class="ttips-cont"><p>本月：<span class="ttips-num">' + now + '</span>套</p><p>市占：<span class="ttips-num">' + p.data + '</span>%</p><div class="ttips-info"><p>上月：<span class="ttips-num">' + prev + '</span>套</p><p class="' + (prev > 0 ? ((status ? 'up">环比上升：<span> +' : 'down">环比下降：<span> -') + '</span><span>' + dealRate + '</span><span>%</span>') : '">--') + '</p></div></div>';
          return _html;
        };
      } else {

        data.tformatter = function(p, r, v) {
          p = p[0];
          var pdata = _this.companyDealRate[$('#trendList .selected:eq(1)').index()];
          var base = _this.companyDealRate[$('#trendList .selected:eq(0)').index()];
          var index = p.dataIndex + 1;
          var prev = pdata.transferCountList[index];
          var now = base.transferCountList[index];
          var status = now >= prev;
          var dealRate = Math.abs(now - prev);
          var _html = '<div class="trend-tips compare"><div class="ttips-cont"><p class="ttips-info ' + (status ? 'up">赢：<span> +' : 'down">输：<span> -') + '</span><span>' + dealRate + '</span>套</p><p>' + base.companyName + '：<span class="ttips-num">' + now + '</span>套</p><p>' + pdata.companyName + '：<span class="ttips-num">' + prev + '</span>套</p></div>';
          return _html;
        };
        var series = JSON.parse(JSON.stringify(data.series));
        // console.log(series);

        // 设置面积
        data.series.forEach(function(v, i, a) {
          v.zlevel = 3;
          v.itemStyle = { normal: { areaStyle: { color: colorsi[i], type: 'default' } } };
        });
        data.series.push.apply(data.series, series);
        // console.log(data);

      }

    },
    // 设置line面积异或
    showDiff: function(opt) {
      var echart = opt.echart;
      var datas = echart.getSeries();
      if (datas.length <= 1) return false;
      $('#dataChart1 canvas:nth-last-child(2)').css('visibility', 'hidden');

      var zender = echart.getZrender();
      var arr = zender.painter._domRoot.children;
      var canvas = arr[arr.length - 3];
      var ctx = canvas.getContext('2d');

      var prevd = datas[0].data;
      var nextd = datas[1].data;

      var i, len = 12;
      for (i = 0; i < len; i++) {
        echart.addData(
          0,
          prevd[i],
          false,
          false
        );
      }

      ctx.globalCompositeOperation = "xor";

      for (i = 0; i < len; i++) {
        echart.addData(
          1,
          nextd[i],
          false,
          false
        );
      }

    },
    // 趋势对比渲染
    renderCompanyChart: function() {
      var data = {};
      var _this = this;
      _this.trigger('formatCompanyDealRate', data);
      // console.log(data);
      var option = {
        color: data.color,
        tooltip: {
          trigger: 'axis',
          backgroundColor: 'rgba(0,0,0,0)',
          borderRadius: 0,
          padding: 0,
          axisPointer: {
            lineStyle: {
              color: '#e3e3e3',
              width: 1
            }
          },
          formatter: data.tformatter
        },
        legend: {
          data: data.legend,
          selectedMode: false
        },
        grid: {
          y: 30,
          y2: 30,
          borderWidth: 0
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
              color: '#e3e3e3',
              width: 1
            }
          },
          splitLine: {
            show: false
          },
          data: _this.companyDealRate.monthList.slice(1)
        }],
        yAxis: [{
          type: 'value',
          splitNumber: 10,
          axisLabel: {
            formatter: function(v) {
              return v.toFixed(2) + '%'
            }
          },
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
          min: data.min,
          max: data.max
        }],
        series: data.series
      };

      var myChart = ec.init(document.getElementById('dataChart1'), 'macarons');
      myChart.clear();
      myChart.setOption(option);

      _this.trigger('showDiff', { echart: myChart });
      setTimeout(function() {
        $('#dataChart1 canvas').css('visibility', '');
      }, 500)
    },
    // 国土数据
    fetchOtherDealRateStat: function(opt) {
      var _this = this;
      $.ajax({
        url: opt.url,
        dataType: 'JSON',
        data: opt.data
      }).done(function(res) {
        if (res.status != 0) {
          console.log('数据异常!')
          return false;
        }
        if (!res.data) {
          $('#dataChart2').empty();
          return false;
        }

        _this.trigger('renderOtherChart', res.data);
      });
    },
    // 国土数据渲染
    renderOtherChart: function(data) {
      var datat = data.transferCountList.slice(1);
      var prevg;
      var nexvg = Math.floor(datat.reduce(function(acc, val, index) {
        if (index == 6) {
          prevg = acc / 6;
          acc = 0;
        }
        return acc + val;
      }) / 6);
      var option = {
        backgroundColor: '#fff',
        title: {
          text: '国土成交数据',
          x: 'center'
        },
        tooltip: {
          trigger: 'axis',
          backgroundColor: 'rgba(0,0,0,0)',
          borderRadius: 0,
          padding: 0,
          textStyle: { color: 'rgba(0,0,0,0)' },
          axisPointer: {
            lineStyle: {
              color: '#e3e3e3',
              width: 1
            }
          },
          formatter: function(p, r, v) {
            p = p[0];
            var prev = data.transferCountList[p.dataIndex];
            var now = p.data;
            var status = now >= prev;
            var dealRate = prev > 0 ? Math.abs(((now - prev) / prev * 100).toFixed(2)) : now * 100;
            var _html = '<div class="trend-tips"><div class="ttips-cont"><p>上月：<span class="ttips-num">' + prev + '</span></p><p>本月：<span class="ttips-num">' + now + '</span></p><p class="ttips-info ' + (prev > 0 ? ((status ? 'up">环比上升：<span> +' : 'down">环比下降：<span> -') + '</span><span>' + dealRate + '</span><span>%</span>') : '">--') + '</p></div>';
            return _html;
          }
        },
        grid: {
          y: 40,
          y2: 40,
          borderWidth: 0
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
          // boundaryGap: false,
          data: data.monthList.slice(1)
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
          type: 'value'
        }],
        series: [{
          name: '预购',
          type: 'line',
          smooth: true,
          symbolSize: 7,
          symbol: 'image://static/img/circle.png',
          markLine: {
            clickable: false,
            itemStyle: {
              normal: {
                color: '#fd0000',
                lineStyle: {
                  width: 1
                }
              },
              emphasis: {
                color: '#fd0000',
                lineStyle: {
                  width: 1
                }
              }
            },
            symbol: 'none',
            data: [
              [{ name: '12121', xAxis: 0, yAxis: (3 * prevg - nexvg) / 2 },
                { name: '232323', xAxis: 11, yAxis: (3 * nexvg - prevg) / 2 }
              ]
            ]
          },
          itemStyle: { normal: { color: '#008de4', areaStyle: { type: 'default', color: 'rgba(0,141,228,0.1)' } } },
          data: datat
        }]
      };

      // console.log(option);
      var myChart = ec.init(document.getElementById('dataChart2'), 'macarons');
      myChart.setOption(option);
    }
  },
  events: {
    'click #trendList dd': 'selectList'
  },
  handle: {
    selectList: function(e) {
      var dom = $(e.target).closest('.flexbox');
      var list = $('#trendList .selected');
      if (dom.hasClass('disabled') || (list.length == 1 && dom.hasClass('selected'))) return;
      if (dom.hasClass('selected')) {
        dom.removeClass('selected');
        dom.find('span').removeClass('icon-zhengque3');
        $('#trendList .disabled').removeClass('disabled');
      } else {
        dom.addClass('selected');
        dom.find('span').addClass('icon-zhengque3');
      }
      list = $('#trendList .selected');
      if (list.length > 1) {
        $('#trendList .flexbox:not(.selected)').addClass('disabled');
      }
      this.trigger('renderCompanyChart');
    }
  }
};
