var coala = require('coala');
var config = require('config');
var tpl = require('./index.html');
var summaryTpl = require('./summary.html');
var summaTpl = require('./summa.html');
var fillChartData = require('fillChartData');
require('./index.css');

var ec = require('echarts/echarts');
require('echarts/chart/line');
require('echarts/chart/bar');

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
          _this.trigger('fetchOrgHouseRateStat');
          _this.trigger('fetchOrgDealRateStat');
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
        _this.garden.clearValue();
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
        _this.garden.clearValue();
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
        _this.garden.clearValue();
        _this.trigger('query');
      }).on('bs.select.clear', function() {

      });

      this.garden = $('#garden').select({
        search: true,
        url: '/bi/common/gardenList.json',
        placeholder: '输入楼盘名称',
        keyword: 'keyWord',
        params: function() {
          return {
            city: _this.city.value.fullPinYin
          }
        },
        dataFormater: function(data) {
          return data.data;
        }
      });
      $('#garden').on('bs.select.select', function(e, item) {
        _this.trigger('query');
      });

      this.datepicker = $('#selectedMonth').datepicker({
        minView: 'months',
        view: 'months',
        dateFormat: 'yyyy-mm',
        onSelect:function(formattedDate, date, inst){
          _this.list && _this.trigger('query');
        }
      }).data('datepicker');
    },
    resetForm: function() {
      this.city.setValue(this.defaultCity);
      // $('#city').trigger('bs.select.select');

      this.area.clearValue();
      this.area.disable();

      this.garden.clearValue();

      var targetDate = new Date();
      this.datepicker.update({
        maxDate: new Date(targetDate.getFullYear(), targetDate.getMonth() - 1, 1),
        minDate: new Date(2016, 0, 1)
      });
      targetDate.setMonth(targetDate.getMonth() - 2);
      this.datepicker.selectDate(targetDate);
    },
    // 报盘率图表
    fetchOrgHouseRateStat: function() {
      var _this = this;
      $.ajax({
        url: '/bi/marketing/bizAreaHouseRateStatByMonth.json',
        dataType: 'JSON',
        data: {
          statMonth: _this.datepicker.el.value,
          type: _this.params.type,
          ids: _this.params.ids,
          parentId: _this.params.parentId
        }
      }).done(function(res) {
        if (!res.data || res.status != 0) {
          console.log('数据异常!')
          return false;
        }
        if (!res.data.statMonthList.length) {
          $('#dataChart0').empty().addClass('chart-no-data');
          return false;
        }
        $('#dataChart0').removeClass('chart-no-data');
        // _this.trigger('fillChartData', res.data);
        fillChartData({data:res.data, lastMoth:_this.datepicker.el.value});

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
        url: '/bi/marketing/bizAreaDealRateStatByMonth.json',
        dataType: 'JSON',
        data: {
          statMonth: _this.datepicker.el.value,
          type: _this.params.type,
          ids: _this.params.ids,
          parentId: _this.params.parentId
        }
      }).done(function(res) {
        if (!res.data || res.status != 0) {
          console.log('数据异常!')
          return false;
        }
        if (!res.data.statMonthList.length) {
          $('#dataChart1').empty().addClass('chart-no-data');
          return false;
        }
        $('#dataChart1').removeClass('chart-no-data');
        // _this.trigger('fillChartData', res.data);
        fillChartData({data:res.data, lastMoth:_this.datepicker.el.value});

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
    // fillChartData: function(data) {
    //   var _this = this;
    //   var month = data.statMonthList;
    //   var diff = 6 - month.length;
    //   if (diff > 0) {
    //     var firstDate = month[0];
    //     var m1 = new Date(firstDate);

    //     while (diff--) {
    //       m1.setMonth(m1.getMonth() - 1);
    //       data.statMonthList.unshift(m1.getFullYear() + '-' + ('0' + (m1.getMonth() + 1)).substr(-2));
    //       data.wsCountList.unshift(undefined);
    //       data.gtCountList.unshift(undefined);
    //       data.rateList.unshift(undefined);
    //     }
    //   }
    // },
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
          z: '10',
          smooth: false,
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
          // barWidth: 15,
          barGap: '0',
          barCategoryGap: '44', //'44',
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
          // barWidth: 15,
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
          name: 'itemName',
          align: 'center',
          width: 260,
          lockWidth: true
        }, {
          title: '有效报盘数',
          name: 'wsHouseCount',
          align: 'center',
          width: 140,
          lockWidth: true
        }, {
          title: '我司过户数',
          name: 'wsTransferCount',
          align: 'center',
          width: 140,
          lockWidth: true
        }, {
          title: '国土过户数',
          name: 'gtTransferCount',
          align: 'center',
          width: 140,
          lockWidth: true
        }, {
          title: '报盘率',
          name: 'houseRate',
          align: 'center',
          lockDisplay: true,
          width: 140,
          lockWidth: true,
          sortable: true,
          type: 'number'
        }, {
          title: '市占率',
          name: 'dealRate',
          align: 'center',
          width: 140,
          lockWidth: true,
          sortable: true,
          type: 'number'
        }],
        method: 'get',
        url: '/bi/marketing/statByBizArea.json',
        params: function() {
          return {
            statMonth: _this.datepicker.el.value,
            type: _this.params.type,
            ids: _this.params.ids,
            parentId: _this.params.parentId
          }
        },
        transform: function(res) {
          _this.trigger('statistics', res.data.parallelList);
          _this.trigger('summa', res.data.parallelList);
          if (!res.data.subList.length) {
            // 当以楼盘名称进行查询时，则以汇总数据显示在列表中
            if (_this.params.type == 4) {
              return res.data.parallelList;
            } else {
              return false;
            }
          } else {
            return res.data.subList;
          }
        },
        indexCol: true,
        noDataText: '',
        indexColWidth:60,
        // fullWidthRows: true,
        showBackboard: false
      }).on('loadSuccess', function(e, data) {
        $(this).parent().removeClass('table-no-data');
        $(this).closest('.mmGrid').find('th:eq(0) .mmg-title').text('排名');
        !data && $(this).parent().addClass('table-no-data');
        _this.$('.nav-tabs .active a').trigger('click');
      });
    },
    summa:function(data){
      if (!data.length) {
        $('#summary').hide();
        return false;
      }

      var temp = data[0];
      var dateTime = this.datepicker.el.value;

      temp.itemName += dateTime.replace('-','年') + '月';
      //
      // console.log(this.datepicker.el.value);
      $('#summary').html(summaTpl(temp)).show();
    },
    statistics: function(data) {
      if (!data.length) {
        $('#statistics').hide();
        return false;
      }
      $('#statistics').html(summaryTpl(data[0])).show();

      var $mmHead = $('.mmg-head th');
      var statTd = $('#statistics').find('table td');
      for (var i = $mmHead.length - 1; i >= 0; i--) {
        statTd.eq(i).width($mmHead.eq(i).width() - 2);
      }
    },
    queryParams: function() {
      var p = {
        order: $('.nav-tabs .active a').data('order')
      };
      if (this.garden.value) {
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

    sortColumn: function(e) {
      var selectedIndex = $(e.currentTarget).data('index');
      var $title = $('.mmg-head th:eq(' + selectedIndex + ') .mmg-title');

      // 强制设置当前排序方式为升序，以便触发点击后永远以降序排序。
      $.data($title[0], 'sortStatus', 'asc');
      $title.trigger('click');

      this.trigger('resetIndexColumn');
    },
    resetIndexColumn: function() {
      var $index = this.list.$body.find('.mmg-index');
      for (var i = $index.length; i > 0; i--) {
        $index.eq(i - 1).text(i);
      }
      $('.mmg-bodyWrapper').scrollTop(0);
    },
    query:function(){
      if (!this.datepicker.el.value.length) {
        alert('请选择月份!')
        this.datepicker.show();
        return false;
      }

      this.trigger('queryParams');
      this.trigger('fetchOrgHouseRateStat');
      this.trigger('fetchOrgDealRateStat');
      this.list.load();
    }
  },
  events: {
    // 'click #query': 'query',
    'click #clear': 'clear',
    'click #export': 'export',
    'click .nav-tabs a': 'sortColumn',
    'click .mmg-canSort': 'resetIndexColumn'
  },
  handle: {
    // query: function(e) {
    //   e.currentTarget.blur();
    //   if (!this.datepicker.el.value.length) {
    //     alert('请选择月份!')
    //     this.datepicker.show();
    //     return false;
    //   }

    //   this.trigger('queryParams');
    //   this.trigger('fetchOrgHouseRateStat');
    //   this.trigger('fetchOrgDealRateStat');
    //   this.list.load();
    // },
    clear: function() {
      this.trigger('resetForm');
    },
    export: function() {
      var params = {
        orderField: this.params.order, //1报盘率，2市占率
        orderType: 2, //1升序，2降序
        statMonth: this.datepicker.el.value,
        type: this.params.type,
        ids: this.params.ids,
        parentId: this.params.parentId
      };
      location.href = '/bi/marketing/statByBizArea.excel?' + $.param(params);
    },
    sortColumn: function(e) {
      this.trigger('sortColumn', e);
    },
    resetIndexColumn: function(){
      this.trigger('resetIndexColumn');
    }
  }
};
