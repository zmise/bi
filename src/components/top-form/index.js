var coala = require('coala');
var config = require('config');
var tpl = require('./index.html');
require('./index.css');

var orgType = {
  1: 'city',
  2: 'district',
  3: 'area',
  4: 'region',
  5: 'subbranch'
};

// ：售
var stype = {
  id: '1',
  name: '售'
};

module.exports = {
  tpl: tpl,
  listen: {
    init: function () {
      var _this = this;
      // 缓存参数作查询和导出用
      this.params = {};
      this.getParams = function () {
        _this.trigger('queryParams');
        return {
          statDate: _this.datepicker.el.value,
          orgIds: _this.params.ids,
          houseStatus: _this.stype.value.id
        };
      };
      this.trigger('fetchURIParams');
    },
    // 获取url携带的参数
    fetchURIParams: function () {
      var infos = {};
      var arrs = location.search.substr(1).split('&');
      arrs.forEach(function (v, i, arr) {
        var items = v.split('=');
        infos[items[0]] = items[1];
      });

      this.URIinfos = infos;
    },
    mount: function () {
      this.trigger('initForm');
      this.trigger('fetchDefaultCity');
    },
    // 获取默认值
    fetchDefaultCity: function () {
      var _this = this;
      $.ajax({
        url: '/bi/marketing/orgBaseInfo.json'
      }).done(function (res) {
        _this.defaultCity = res.data.defaultOrg;
        _this.maxPermissionOrgType = res.data.maxPermissionOrgType;

        if (_this.maxPermissionOrgType == 1) {
          $('#filter .bi-dropdown-list:lt(5)').removeClass('bi-dropdown-list');
        } else {
          $('#filter .bi-dropdown-list:lt(5)').filter(':gt(' + (_this.maxPermissionOrgType - 2) + ')').removeClass('bi-dropdown-list');
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
      this.trigger('uriToForm');
      this.trigger('queryParams');
      this.trigger('initFormEvent');
    },
    // 城市下拉列表
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

        if (_this.URIinfos.city && opt.uri) {
          _this.city.setValueById(_this.URIinfos.city);

          if (_this.URIinfos.district) {
            _this.trigger('fetchDistrictList', {
              longNumber: _this.city.value.longNumber,
              uri: true
            });
          } else if (_this.URIinfos.area) {
            $('#district').hide();
            _this.district.clearValue();
            _this.district.disable();
            _this.trigger('fetchAreaList', {
              longNumber: _this.city.value.longNumber,
              uri: true
            });
          } else {
            $('#city').trigger('bs.select.select');
          }
        }

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
          $('#district').show();

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

          if (_this.URIinfos.district && opt.uri) {
            _this.district.setValueById(_this.URIinfos.district);
            if (_this.URIinfos.area) {
              _this.trigger('fetchAreaList', {
                longNumber: _this.district.value.longNumber,
                uri: true
              });
            } else {
              $('#district').trigger('bs.select.select');
            }
          }

        } else {

          $('#district').hide();
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

        if (_this.URIinfos.area && opt.uri) {
          _this.area.setValueById(_this.URIinfos.area);
          if (_this.URIinfos.region) {
            _this.trigger('fetchRegionList', {
              longNumber: _this.area.value.longNumber,
              uri: true
            });
          } else {
            $('#area').trigger('bs.select.select');
          }
        }

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

        if (_this.maxPermissionOrgType != 4) {
          res.data.unshift({
            id: '-1',
            name: "全部片区"
          });
        }
        _this.region.option.data = res.data;
        _this.region.render();
        _this.region.enable();

        if (_this.URIinfos.region && opt.uri) {
          _this.region.setValueById(_this.URIinfos.region);
          $('#region').trigger('bs.select.select');
        }

        _this.subbranch.clearValue();
        _this.subbranch.disable();
      }).done(function () {
        opt && opt.reset && _this.trigger('formRender');
      });
    },

    fetchSubbranchList: function (opt) {
      this.subbranch.clearValue();
      this.subbranch.disable();
      var _this = this;
      $.ajax({
        url: '/bi/common/orgList.json',
        data: {
          orgType: 5,
          parentLongNumbers: opt.longNumber
        }
      }).then(function (res) {

        if (_this.maxPermissionOrgType != 5) {
          res.data.unshift({
            id: '-1',
            name: "全部分店"
          });
        }
        _this.subbranch.option.data = res.data;
        _this.subbranch.render();
        _this.subbranch.enable();
      }).done(function () {
        opt && opt.reset && _this.trigger('formRender');
      });
    },

    initForm: function () {
      this.stype = $('#type').select({
        data: [{
          id: '1',
          name: '售'
        },
        {
          id: '2',
          name: '租'
        }
        ],
        value: stype
      });

      this.city = $('#city').select({
        placeholder: '城市',
        data: ['城市']
      });

      this.district = $('#district').select({
        placeholder: '全部大区',
        data: ['全部大区']
      });

      this.area = $('#area').select({
        placeholder: '全部区域',
        data: ['全部区域']
      });

      this.region = $('#region').select({
        placeholder: '全部片区',
        data: ['全部片区'],
      });

      this.subbranch = $('#subbranch').select({
        placeholder: '全部分店',
        data: ['全部分店']
      });

      this.datepicker = $('#selectedDate').datepicker({
        minView: 'days',
        view: 'days',
        dateFormat: 'yyyy-mm-dd'
      }).data('datepicker');

    },
    resetForm: function () {
      // 对当前级别的下拉设置默认值
      this[orgType[this.maxPermissionOrgType]].setValue(this.defaultCity);

      // 默认类型
      this.stype.setValue(stype);

      // 重置默认日期为当前时间上一天
      var targetDate = new Date();
      targetDate.setDate(targetDate.getDate() - 1);
      this.datepicker.selectDate(targetDate);

      // $('#' + orgType[this.maxPermissionOrgType]).trigger('bs.select.select');

    },
    uriToForm: function () {
      var data = this.URIinfos;
      if (!data.checkMonth) {
        return;
      }

      // 当月最后一天
      var searchDate = new Date(data.checkMonth);
      searchDate.setMonth(searchDate.getMonth() + 1);
      searchDate.setDate(0);
      this.datepicker.selectDate(searchDate);
      this.stype.setValueById(data.houseStatus);

      // 根据当前权限级别获取下拉数据
      var target = orgType[this.maxPermissionOrgType].replace(/\w/, function (char) {
        return char.toUpperCase();
      });

      this.trigger('fetch' + target + 'List', {
        uri: true
      });

    },
    setQuerycall: function (callback) {
      if ($.isFunction(callback)) {
        this.queryCallback = callback;
      }
    },
    query: function () {
      if (!this.datepicker.el.value.length) {
        alert('请选择日期!')
        this.datepicker.show();
        return false;
      }
      this.queryCallback && this.queryCallback(this.getParams());
    },
    initFormEvent: function () {
      var _this = this;
      $('#type').on('bs.select.select', function (e, item) {
        _this.trigger('query');
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

      $('#district').on('bs.select.select', function (e, item) {
        var id = _this.district.value.id;
        var longNumber = _this.district.value.longNumber;

        if (id == '-1') {
          _this.district.clearValue();
          _this.area.clearValue();
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

      $('#area').on('bs.select.select', function (e, item) {
        var id = _this.area.value.id;
        var longNumber = _this.area.value.longNumber;

        if (id == '-1') {
          _this.area.clearValue();
        } else {
          _this.trigger('fetchRegionList', {
            longNumber: longNumber
          });
        }

        _this.trigger('query');
      }).on('bs.select.clear', function () {
        _this.region.clearValue();
        _this.region.disable();
      });

      $('#region').on('bs.select.select', function (e, item) {
        var id = _this.region.value.id;
        var longNumber = _this.region.value.longNumber;

        if (id == '-1') {
          _this.region.clearValue();
        } else {
          _this.trigger('fetchSubbranchList', {
            longNumber: longNumber
          });
        }
        _this.trigger('query');
      }).on('bs.select.clear', function () {
        _this.subbranch.clearValue();
        _this.subbranch.disable();
      });

      $('#subbranch').on('bs.select.select', function (e, item) {
        var id = _this.subbranch.value.id;
        var longNumber = _this.subbranch.value.longNumber;

        if (id == '-1') {
          _this.subbranch.clearValue();
        }
        _this.trigger('query');
      });

      this.datepicker.update({
        onSelect: function (formattedDate, date, inst) {
          _this.trigger('query');
        }
      });

      if (!this.URIinfos.checkMonth) {
        $('#' + orgType[this.maxPermissionOrgType]).trigger('bs.select.select');
      }
    },
    queryParams: function () {
      var p = {};

      // 由于当前页面暂时不加楼盘相关查询，条件永远为假
      if (this.subbranch.value) {
        p.type = 5;
        p.ids = this.subbranch.value.id;
        p.name = this.subbranch.value.name;
      } else if (this.region.value) {
        p.type = 4;
        p.ids = this.region.value.id;
        p.name = this.region.value.name;
      } else if (this.area.value) {
        p.type = 3;
        p.ids = this.area.value.id;
        p.name = this.area.value.name;
      } else if (this.district.value) {
        p.type = 2;
        p.ids = this.district.value.id;
        p.name = this.district.value.name;
      } else if (this.city.value) {
        p.type = 1;
        p.ids = this.city.value.id;
        p.name = this.city.value.name;
      }
      this.params = p;
    },
  },
  events: {
    'click #clear': 'clear',
    'click #export': 'export'
  },
  handle: {
    clear: function () {
      this.trigger('resetForm');
    },
    export: function () {
      location.href = this.$('#export').attr('to-url') + $.param(this.getParams());
    }
  }
};
