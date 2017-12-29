var coala = require('coala');
var config = require('config');
var tpl = require('./index.html');
require('./index.css');

var orgType = {
  1: 'city',
  2: 'district',
  3: 'area',
  4: 'region'
};

module.exports = {
  tpl: tpl,
  listen: {
    init: function () {
      // 缓存参数作查询和导出用
      this.params = {};
    },
    mount: function () {
      this.trigger('initForm');
      this.trigger('fetchDefaultCity');
    },
    fetchDefaultCity: function () {
      var _this = this;
      $.ajax({
        url: '/bi/marketing/orgBaseInfo.json'
      }).done(function (res) {
        _this.defaultCity = res.data.defaultOrg;
        _this.maxPermissionOrgType = res.data.maxPermissionOrgType;


        if (_this.maxPermissionOrgType == 1) {
          $('#filter .bi-dropdown-list:lt(4)').removeClass('bi-dropdown-list');
        } else {
          $('#filter .bi-dropdown-list:lt(4)').filter(':gt(' + (_this.maxPermissionOrgType - 2) + ')').removeClass('bi-dropdown-list');
        }

        $('#filter').css('visibility', 'visible');

        // 根据当前权限级别获取下拉数据
        var target = orgType[_this.maxPermissionOrgType].replace(/\w/, function (char) {
          return char.toUpperCase();
        });
        _this.trigger('fetch' + target + 'List', {
          reset: true
        });
      });
    },
    formRender: function () {
      this.trigger('resetForm');

      this.trigger('queryParams');
    },
    fetchCityList: function (opt) {
      var _this = this;
      $.ajax({
        url: '/bi/common/orgList.json',
        data: {
          orgType: 1
        }
      }).then(function (res) {
        _this.city.option.data = res.data;
        _this.city.render();
      }).done(function () {
        opt && opt.reset && _this.trigger('formRender');
      });
    },
    fetchDistrictList: function (opt) {
      this.district.clearValue();
      this.district.disable();
      var _this = this;
      $.ajax({
        url: '/bi/common/orgList.json',
        data: {
          orgType: 2,
          parentLongNumbers: opt.longNumber
        }
      }).then(function (res) {
        if (res.data.length) {
          $('#district').parent().show();

          if (_this.maxPermissionOrgType != 2) {
            res.data.unshift({
              id: '-1',
              name: "全部大区"
            });
          }
          _this.district.option.data = res.data;
          _this.district.render();
          _this.district.enable();

          _this.area.clearValue();
          _this.area.disable();
        } else {

          $('#district').parent().hide();
          _this.district.clearValue();
          _this.district.disable();

          _this.trigger('fetchAreaList', {
            longNumber: opt.longNumber
          });
        }

      }).done(function () {
        opt && opt.reset && _this.trigger('formRender');
      });
    },
    fetchAreaList: function (opt) {
      this.area.clearValue();
      this.area.disable();
      var _this = this;
      $.ajax({
        url: '/bi/common/orgList.json',
        data: {
          orgType: 3,
          parentLongNumbers: opt.longNumber
        }
      }).then(function (res) {

        if (_this.maxPermissionOrgType != 3) {
          res.data.unshift({
            id: '-1',
            name: "全部区域"
          });
        }
        _this.area.option.data = res.data;
        _this.area.render();
        _this.area.enable();


        _this.region.clearValue();
        _this.region.disable();

      }).done(function () {
        opt && opt.reset && _this.trigger('formRender');
      });
    },
    fetchRegionList: function (opt) {
      this.region.clearValue();
      this.region.disable();
      var _this = this;
      $.ajax({
        url: '/bi/common/orgList.json',
        data: {
          orgType: 4,
          parentLongNumbers: opt.longNumber
        }
      }).then(function (res) {

        if (_this.maxPermissionOrgType != 3) {
          res.data.unshift({
            id: '-1',
            name: "全部区域"
          });
        }
        _this.region.option.data = res.data;
        _this.region.render();
        _this.region.enable();

      }).done(function () {
        opt && opt.reset && _this.trigger('formRender');
      });
    },
    initForm: function () {
      var _this = this;
      this.city = $('#city').select({
        placeholder: '城市',
        data: ['城市']
      });
      $('#city').on('bs.select.select', function (e, item) {
        var id = _this.city.value.id;
        var longNumber = _this.city.value.longNumber;

        //组织类型： 1: 城市
        _this.params.type = 1;
        _this.params.ids = id;

        _this.trigger('fetchDistrictList', {
          longNumber: longNumber
        });

        _this.trigger('query');
      });

      this.district = $('#district').select({
        placeholder: '全部大区',
        data: ['全部大区']
      });
      $('#district').on('bs.select.select', function (e, item) {
        var id = _this.district.value.id;
        var longNumber = _this.district.value.longNumber;

        if (id == '-1') {
          _this.area.clearValue();
          _this.area.disable();
        } else {
          _this.trigger('fetchAreaList', {
            longNumber: longNumber
          });
        }

        _this.trigger('query');
      }).on('bs.select.clear', function () {
        _this.area.clearValue();
        _this.area.disable();
      });

      this.area = $('#area').select({
        placeholder: '全部区域',
        data: ['全部区域']
      });
      $('#area').on('bs.select.select', function (e, item) {
        var id = _this.area.value.id;
        var longNumber = _this.area.value.longNumber;

        if (id == '-1') {
          _this.region.clearValue();
          _this.region.disable();
        } else {
          _this.trigger('fetchRegionList', {
            longNumber: longNumber
          });
        }

        _this.trigger('query');
      }).on('bs.select.clear', function () {
        _this.region.clearValue();
        _this.region.disable();
      });;

      this.region = $('#region').select({
        placeholder: '全部片区',
        data: ['全部片区']
      });
      $('#region').on('bs.select.select', function (e, item) {

        _this.trigger('query');
      });

      this.datepicker = $('#selectedMonth').datepicker({
        minView: 'months',
        view: 'months',
        dateFormat: 'yyyy-mm'
      }).data('datepicker');
    },

    resetForm: function () {
      var _this = this;
      // 对当前级别的下拉设置默认值
      this[orgType[this.maxPermissionOrgType]].setValue(this.defaultCity);
      //
      // this.area.clearValue();
      // this.area.disable();

      // 重置默认月份，和最大最小可选月份。
      var targetDate = new Date();
      this.datepicker.update({
        maxDate: new Date(targetDate.getFullYear(), targetDate.getMonth() - 1, 1),
        minDate: new Date(2016, 0, 1)
      });
      targetDate.setMonth(targetDate.getMonth() - 2);
      this.datepicker.selectDate(targetDate);
      this.datepicker.update({
        onSelect: function (formattedDate, date, inst) {
          _this.trigger('query');
        }
      });

      $('#' + orgType[this.maxPermissionOrgType]).trigger('bs.select.select');
    },

    fecthDealRateCheck: function (indicatorType) {
      var _this = this;
      var domId = '';
      var url = 'org.html';
      var houseStatus = '';
      var indicatorTypeStr = '';
      var unit = '%';
      var tabId;
      var data = {
        indicatorType: indicatorType,
        orgType: this.params.type,
        orgId: this.params.ids,
        checkMonth: this.datepicker.el.value
      };
      switch (indicatorType) {
        case 1:
          domId = 'dealRateCheck';
          indicatorTypeStr = '&indicatorType=1';
          tabId = '6cf9ed71-283a-4640-895e-402c4b2d5b29';
          break;
        case 2:
          domId = 'offerRateCheck';
          tabId = '6cf9ed71-283a-4640-895e-402c4b2d5b29';
          indicatorTypeStr = '&indicatorType=2';
          break;
        case 3:
          url = 'release-rate.html';
          domId = 'releaseRate';
          tabId = '872fd853-4804-45b1-9845-1867793f4933';
          houseStatus = '&houseStatus=1';
          break;
        case 4:
          url = 'real-comparable.html';
          domId = 'realComparable';
          tabId = 'adfb6b2a-0dc8-4870-b06e-c8bd6bf93de8';
          houseStatus = '&houseStatus=1';
          break;
        case 5:
          url = 'input-ratio.html';
          domId = 'proportioning';
          unit = '人';
          break;
        case 6:
          url = 'line-ratio.html';
          tabId = '80e4435d-7d64-4859-8cb6-73141370f753';
          domId = 'lineRatio';
          break;
        case 7:
          url = 'achievements.html';
          domId = 'achievement';
          tabId = '77a6e396-5402-496c-a904-20340f7cb939';
          unit = '万';
          data.cityOrgId = _this.city.value.id;
          break;
        case 8:
          url = 'broker-ratio.html';
          domId = 'proportioning';
          unit = '人';
          break;
        case 9:
          url = 'org-broker-ratio.html';
          domId = 'proportioning';
          tabId = '41dc714c-436c-4533-8261-85c85b24f408';
          unit = '人';
          break;
      }
      this.trigger('renderBeBox', domId, null, '请求数据中…');
      $.ajax({
        // url: '/bi/orgCheck/dealRateCheck.json',
        url: '/bi/orgCheck/check.json',
        data: data
      }).done(function (res) {
        if (res.status || !res.data) {
          _this.trigger('renderBeBox', domId, null, '暂无数据！');
          return;
        }
        res.data.unit = unit;
        res.data.url = url;
        res.data.indicatorTypeStr = indicatorTypeStr;
        res.data.houseStatus = houseStatus;
        res.data.tabId = tabId;
        _this.trigger('renderBeBox', domId, res.data);
      });
    },
    renderBeBox: function (domid, data, string) {
      var container = $('#' + domid);
      var result;
      var $bebtn;
      var float;
      var _html = '<div class="behave gray"> <div class="bh-score-box"></div> <p class="bh-desc">' + string + '</p> </div> <p class="bh-sbox"></p>';
      var tipsBox = container.closest('.be-box').find('.bangzhu-box').hide();
      container.next().empty();
      if (data) {
        result = this.rateCheck(data.checkResultTypeValue);

        // 责任盘人员配比健康度特殊处理
        if (domid === 'proportioning') {
          switch (data.checkResultTypeValue) {
            case 1: result.desc = '人员不足'; break;
            case 2: result.desc = '人员紧张'; break;
            case 3: result.desc = '人员充足';
          }
        }

        // 设置帮助提醒的浮动值
        tipsBox.find('.js-float').text(this.formatValue(data.yellowThreshold) + data.unit);
        tipsBox.find('.js-checkThreshold').text(this.formatValue(data.greenThreshold) + data.unit);
        tipsBox.css('display', '');

        _html = '<div class="behave ' + result.behave + '"> <div class="bh-score-box"><span class="bh-score">' + this.formatValue(data.realValue) + '</span>' + data.unit + '</div> <p class="bh-desc">' + result.desc + '</p> </div> <p class="bh-sbox">考核指标：<span class="bh-setting">' + this.formatValue(data.greenThreshold) + data.unit + '</span></p>';
        $bebtn = $('<a class="be-btn" href="javascript:;" data-search="' + data.url + '?' + this.getSearchFile() + data.indicatorTypeStr + data.houseStatus + '">查看详情</a>');
        $bebtn.on('click', function (e) {
          var $this = $(this);
          try {
            if (parent.location.host === 'bi.qfang.com') {
              // if (parent.location.host) {
              window.open($this.data('search'));
            }
          } catch (error) {
            parent.postMessage({
              search: 'http://bi.qfang.com/stat-pc-front/' + $this.data('search') + '&noParseTabUrl=1',
              id: data.tabId,
              method: 'createTab'
            }, '*');
          }

        });
      }

      // 设置中间具体内容
      container.html(_html);

      container.next().html($bebtn);
    },

    renderBeBoxes: function () {
      this.trigger('fecthDealRateCheck', 1);
      this.trigger('fecthDealRateCheck', 2);
      this.trigger('fecthDealRateCheck', 3);
      this.trigger('fecthDealRateCheck', 4);
      // this.trigger('fecthDealRateCheck', 5);
      this.trigger('fecthDealRateCheck', 9);
      this.trigger('fecthDealRateCheck', 7);
      this.trigger('fecthDealRateCheck', 6);
    },

    queryParams: function () {
      var p = {};

      if (this.region.value && this.region.value.id !== '-1') {
        p.type = 4;
        p.ids = this.region.value.id;
      } else if (this.area.value && this.area.value.id !== '-1') {
        p.type = 3;
        p.ids = this.area.value.id;
      } else if (this.district.value && this.district.value.id !== '-1') {
        p.type = 2;
        p.ids = this.district.value.id;
      } else if (this.city.value) {
        p.type = 1;
        p.ids = this.city.value.id;
      }
      this.params = p;
    },
    query: function () {
      if (!this.datepicker.el.value.length) {
        alert('请选择月份!')
        this.datepicker.show();
        return false;
      }
      this.trigger('queryParams');
      this.trigger('renderBeBoxes');
    }
  },
  events: {
    'click #clear': 'clear'
  },
  handle: {
    clear: function () {
      this.trigger('resetForm');
    }
  },
  mixins: [{
    formatValue: function (val) {
      val += '';
      var index = val.indexOf('.');
      if (index > -1 && val.length > index + 3) {
        val = (+val).toFixed(2);
      }
      return +val;
    },

    getSearchFile: function () {
      var p = [];
      if (this.city.value) {
        p.push('city=' + this.city.value.id);
      }
      if (this.district.value) {
        p.push('district=' + this.district.value.id);
      }
      if (this.area.value) {
        p.push('area=' + this.area.value.id);
      }
      if (this.region.value) {
        p.push('region=' + this.region.value.id);
      }

      return 'checkMonth=' + this.datepicker.el.value + '&' + p.join('&');
    },

    rateCheck: function (checkResult) {
      switch (checkResult) {
        case 1:
          return {
            behave: 'red',
            desc: '表现较差'
          };
        case 2:
          return {
            behave: 'yellow',
            desc: '需要注意'
          };
        case 3:
          return {
            behave: 'green',
            desc: '表现优异'
          };
      }
    }
  }]
};
