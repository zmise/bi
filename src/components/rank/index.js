var coala = require('coala');
var config = require('config');
var tpl = require('./index.html');
var rankdatasTpl = require('./rankDatas.html');
var rankListTpl = require('./rankList.html');
require('./index.css');
var ec = require('echarts/echarts');
require('echarts/chart/pie');
require('echarts/chart/bar');

module.exports = {
  tpl: tpl,
  listen: {
    initFecth: function(opt) {
      opt.qfang.company = opt.company;
      this.trigger('fecthQfangDealRateStat', opt.qfang);
      this.trigger('fetchOtherDealRateStat', opt.other);
    },
    fecthQfangDealRateStat: function(opt) {
      // 我司市占
      var _this = this;
      $.ajax({
        url: opt.url,
        dataType: 'JSON',
        data: opt.data
      }).then(function(res) {
        if (res.status != 0) {
          console.log('数据异常!')
          return false;
        }

        $('#rankDatas').html(rankdatasTpl(res.data));

        // 缓存我司市占
        _this.qfangDealRate = res.data;
        _this.trigger('fetchCompanyDealRateStat', opt.company);
      });
    },
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
        $('#rankList').html(rankListTpl(res.data));
        var changeChart = $('#changeChart');

        if (!res.data) {
          // 没有数据
          $('#dataChart1').empty();
          changeChart.hide();
          changeChart.parent().next().addClass('no-datas');
          return false;
        }

        changeChart.show();
        changeChart.parent().next().removeClass('no-datas');

        var data = {
          name: [],
          value: []
        };
        var i = res.data.length - 1;
        for (; i >= 0; i--) {
          var item = res.data[i];
          data.name.push(item.companyName);
          data.value.push(item.dealRate);
        }
        while(data.name.length < 10){
          data.name.unshift('-');
          data.value.unshift(undefined);
        }

        // 确认dom节点是显示状态
        $('.rank-chart').eq(0).show();
        _this.trigger('renderCompanyChart', data);

      });
    },
    // 柱形渲染
    renderCompanyChart: function(data) {
      var _this = this;
      var option = {
        tooltip: {
          trigger: 'item'
        },
        grid: {
          x: 0,
          y: 0,
          y2: 0,
          borderWidth: 0
        },
        xAxis: [{
          type: 'value',
          show: false
        }],
        yAxis: [{
          type: 'category',
          data: data.name,
          show: false
        }],
        series: [{
          name: '直接访问',
          type: 'bar',
          barWidth: 16,
          itemStyle: {
            normal: {
              barBorderRadius: 0,
              color: function(r) {
                if (_this.qfangDealRate.place && (r.dataIndex === r.series.data.length - _this.qfangDealRate.place)) return '#ff7611';
                return '#7fc6f1';
              },
              label: {
                show: true,
                position: 'right',
                formatter: '{c}%'
              }
            }
          },
          data: data.value
        }]
      };

      var myChart = ec.init(document.getElementById('dataChart1'), 'macarons');
      myChart.setOption(option);
    },
    // TOP5
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
          // 没有数据
          $('#dataChart2').empty();
          return false;
          }

        // 加入我司市占
        var idata = res.data;
        var sum = 0;
        var data = [];
        var len = idata.length;
        if (!len) {
          $('#dataChart2').empty();
          return false;
        }
        for (var i = 0; i < len; i++) {
          var item = idata[i];
          sum += item.dealRate;
          data.push({
            name: item.companyName,
            value: item.dealRate,
            selected: true
          });
        };
        sum = sum > 100 ? 0 : 100 - sum;
        data.push({
          name: '其他',
          value: sum,
          selected: true
        });
        _this.trigger('renderOtherChart', data);
      });
    },
    // 饼图渲染
    renderOtherChart: function(data) {
      var option = {
        color: ['#ff7611', '#7fc6f1', '#7fc6f1', '#7fc6f1', '#7fc6f1', '#7fc6f1', '#7fc6f1'],
        series: [{
          name: '市占排名',
          type: 'pie',
          center: ['52%', '50%'],
          radius: ['30%', '60%'],
          selectedMode: 'multiple',
          selectedOffset: 2,
          itemStyle: {
            normal: {
              label: {
                formatter: function(p) {
                  var name = p.name;
                  name = name.replace(/.{9}\B/g, '$& \n');
                  return p.percent + '%\n' + name;
                }
              }
            }
          },
          data: data
        }]
      };;
      var myChart = ec.init(document.getElementById('dataChart2'), 'macarons');
      myChart.setOption(option);
    }
  },
  events: {
    'click #changeChart': 'changeChart'
  },
  handle: {
    changeChart: function(e) {
      var btnDom = $('#changeChart');
      var chartDom = $('.rank-chart').eq(0);
      var display = chartDom.css('display');
      if (display == 'none') {
        chartDom.show();
        btnDom.text('切换饼图');
        // $('#rankList .list-icon').hide();
      } else {
        chartDom.hide();
        btnDom.text('切换柱状图');
        // $('#rankList .list-icon').show();
      }
    }
  }
};
