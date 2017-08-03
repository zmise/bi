var coala = require('coala');
var ec = require('echarts/echarts');
require('echarts/chart/pie');

var config = require('config');
var tpl = require('./index.html');
require('./index.css');

module.exports = {
  tpl: tpl,
  listen: {
    mount: function () {
      this.trigger('initDefaultValue');
      this.trigger('initForm');
      this.trigger('fetchCityList');
    },
    // 计算默认值
    initDefaultValue: function () {
      var now = new Date();
      var year = now.getFullYear();
      var minyear = 2017; //最小年份 2017 
      var dif = year - minyear;
      var yearValue = [];
      var data = {
        year: {
          min: minyear,
          max: year
        },
        month: {
          min: now.getMonth(),
          value: [{
            id: -1,
            name: '全年'
          }, {
            id: 1,
            name: '1月'
          }, {
            id: 2,
            name: '2月'
          }, {
            id: 3,
            name: '3月'
          }, {
            id: 4,
            name: '4月'
          }, {
            id: 5,
            name: '5月'
          }, {
            id: 6,
            name: '6月'
          }, {
            id: 7,
            name: '7月'
          }, {
            id: 8,
            name: '8月'
          }, {
            id: 9,
            name: '9月'
          }, {
            id: 10,
            name: '10月'
          }, {
            id: 11,
            name: '11月'
          }, {
            id: 12,
            name: '12月'
          }]
        }
      };


      while (dif >= 0) {
        yearValue.push({
          id: minyear,
          name: minyear + '年'
        });
        minyear++;
        dif--;
      }

      data.year.value = yearValue;
      this.defaultValue = data;

      console.log(this.defaultValue);

    },
    // 获取城市列表
    fetchCityList: function (opt) {
      var _this = this;
      $.ajax({
        url: '/bi/common/o2oCityOrgList.json',
        data: {
          orgType: 1
        }
      }).then(function (res) {
        res.data.unshift({
          id: '',
          name: "全国"
        });
        _this.city.option.data = res.data;
        _this.city.render();
        _this.city.setValue({
          id: '',
          name: "全国"
        });
        _this.trigger('query');
        _this.trigger('initEvent');
      })
    },

    // 初始化表单
    initForm: function () {

      var defaultValue = this.defaultValue;
      this.city = $('#city').select({
        placeholder: '城市',
        data: ['全国']
      });

      this.year = $('#year').select({
        placeholder: '年份',
        value: {
          id: defaultValue.year.max,
          name: defaultValue.year.max + '年'
        },
        data: defaultValue.year.value
      });

      this.month = $('#month').select({
        placeholder: '月份',
        value: {
          id: '-1',
          name: '全年'
        },
        data: defaultValue.month.value.slice(0, defaultValue.month.min + 1)
      });

    },
    // 设置表单监听事件
    initEvent: function () {
      var _this = this;
      $('#city').on('bs.select.change', function (e, item) {
        _this.trigger('query');
      });

      $('#year').on('bs.select.change', function (e, item) {
        var defaultValue = _this.defaultValue;
        var len = item.id === defaultValue.year.max ? defaultValue.month.min : 12;
        _this.month.option.data = defaultValue.month.value.slice(0, len + 1);
        _this.month.render();
        _this.trigger('query');
      });

      $('#month').on('bs.select.change', function (e, item) {
        _this.trigger('query');
      });
    },

    // 查询
    query: function () {
      var year = this.year.value.id;
      var month = this.month.value.id;
      var city = this.city.value.id;

      this.trigger('fetchStat', city, year, month);
      this.trigger('fetchEstimate', city, year, month);


    },
    // 查询 进线转化漏斗统计数据
    fetchStat: function (city, year, month) {
      var _this = this;
      var data = {
        cityOrgId: city
      };
      var str = year + '-{month}-01';

      if (month < 0) {
        data.startStatMonth = str.replace('{month}', '01');
        data.endStatMonth = str.replace('{month}', year < this.defaultValue.year.max ? '12' : this.defaultValue.month.min);
      } else {
        month = ('0' + month).substring(-2);
        data.startStatMonth = data.endStatMonth = str.replace('{month}', month);
      }


      $.ajax({
        url: '/bi/marketing/callInFunnel/stat.json',
        dataType: 'json',
        data: data
      }).done(function (res) {
        console.log(res.data);
        var list = res.data;

        // UV QPPV
        _this.pie = {
          Uv: {
            app: list.appUvCount,
            wap: list.wapUvCount,
            pc: list.pcUvCount,
            count: list.uvCount
          },
          Qppv: {
            app: list.appQppvCount,
            wap: list.wapQppvCount,
            pc: list.pcQppvCount,
            count: list.qppvCount
          }
        };

        // 进线量 + 预约 + Q聊
        list.inSum = list.callInCount + list.appointmentLeadCount + list.qchatCount;

        _this.renderList(list);
        _this.trigger('renderMyChart', list);
        _this.trigger('renderEcharts', _this.$('.conversion-tab .active').data('id'));
      });
    },
    // 预测业绩接口
    fetchEstimate: function (city, year) {
      var _this = this;
      $.ajax({
        url: '/bi/marketing/callInFunnel/estimateCommissionForYear.json',
        dataType: 'json',
        data: {
          cityOrgId: city,
          estimateYear: year
        }
      }).done(function (res) {
        _this.renderList({
          estimateCommission: res.data
        });
      });
    },

    // 渲染tab圆环
    renderEcharts: function (id) {
      var data = this.pie[id];
      var option = {
        color: ['#a683eb', '#66c5e4', '#41ccba'],
        series: [{
          name: '详情页访问情况',
          type: 'pie',
          center: ['47%', '50%'],
          radius: ['40%', '65%'],
          selectedMode: 'multiple',
          selectedOffset: 2,
          itemStyle: {
            normal: {
              label: {
                show: false
              },
              labelLine: {
                show: false
              }
            },
            emphasis: {
              label: {
                show: true,
                position: 'outer',
                textStyle: {
                  fontSize: '14'
                },
                formatter: function (params) {
                  //   console.log(params);
                  return params.name + '\n占：' + params.percent + '%';
                }
              },
              labelLine: {
                show: true,
                length: 10
              }
            }
          },
          data: [{
              value: data.app,
              name: 'APP',
              selected: true
            },
            {
              value: data.wap,
              name: 'wap',
              selected: true
            },
            {
              value: data.pc,
              name: 'pc',
              selected: true
            }
          ]
        }]
      };

      var myChart = ec.init(document.getElementById('charts'), 'macarons');
      myChart.setOption(option);

      // 数据
      this.renderList({
        app: this.formatValue(data.app / data.count * 100),
        wap: this.formatValue(data.wap / data.count * 100),
        pc: this.formatValue(data.pc / data.count * 100),
        count: data.count
      });
    },

    // 漏斗图
    renderMyChart: function (data) {
      var $base = $('#chartsBase');
      var $callInCount = $base.children().eq(0);
      var $appointmentLeadCount = $base.children().eq(1);
      var $qchatCount = $base.children().eq(2);
      var index = ($base.width() + 40) / data.inSum;
      $base.find('.trapezoidal').remove();
      $base.find('.trapezoidal-left').removeClass('trapezoidal-left');
      $base.find('.trapezoidal-right').removeClass('trapezoidal-right');

      if (data.callInCount === 0) {
        $callInCount.hide();
      } else {
        $callInCount.show();
        this.trigger('setWidth', $callInCount, index, data.callInCount, 20);
      }

      if (data.appointmentLeadCount === 0) {
        $appointmentLeadCount.hide();
      } else {
        $appointmentLeadCount.show();
        this.trigger('setWidth', $appointmentLeadCount, index, data.appointmentLeadCount, 0);
      }

      // 

      if (data.qchatCount === 0) {
        $qchatCount.hide();
      } else {
        $qchatCount.show();
        this.trigger('setWidth', $qchatCount, index, data.qchatCount, 20);
      }

      var list = $('#chartsBase > div:visible');
      if (list.length == 0) {
        $base.append('<div class="trapezoidal gray"></div>');
      } else {
        list.eq(0).addClass('trapezoidal-left');
        list.eq(list.length - 1).addClass('trapezoidal-right');
      }


      // 0 ==> 置灰
      $('#myCharts .trapezoidal').each(function () {
        if ($(this).find('span').text() == 0) {
          $(this).closest('.trapezoidal').addClass('gray');
        } else {
          $(this).closest('.trapezoidal').removeClass('gray');
        }
      });
    },
    setWidth: function (selector, index, num, dif) {
      $(selector).width(Math.round(index * num) - dif);
    }

  },

  events: {
    'click .conversion-tab li': 'conversionTab'
  },

  handle: {
    // 
    conversionTab: function (event) {
      var $this = this.$(event.currentTarget);
      var id = $this.data('id');
      var str = '';
      if (id === 'Uv') {
        str = '个';
      } else {
        str = '次';
      }
      $this.addClass('active').siblings().removeClass('active');
      $('#unit').text(str);
      this.trigger('renderEcharts', id);
    }
  },

  mixins: [{
    formatValue: function (val) {
      val += '';
      var index = val.indexOf('.');
      if (index > -1 && val.length > index + 3) {
        val = (+val).toFixed(2);
      }
      return isNaN(+val) ? '' : +val;
    },
    renderList: function (obj) {
      var item;
      for (item in obj) {
        var $item = $('[data-id="' + item + '"]');
        // var value;
        if ($item.length > 0) {
          // if (item.indexOf('Rate')) {
          //   value = this.formatValue(obj[item]);
          // }else{
          //   value = Math.ceil(obj[item],10);
          // }
          $item.text(obj[item]);
        }
      }
    }
  }]
};