var coala = require('coala');

var config = require('config');
require('assets/vendors/ztree/css/zTreeStyle.css');
require('assets/vendors/ztree/js/jquery.ztree.all.min.js');

var tpl = require('./index.html');
require('./index.css');
var dialogSetTpl = require('./dialog-set.html');
var dialogChangeTpl = require('./dialog-change.html');

module.exports = {
  tpl: tpl,
  listen: {
    mount: function () {
      this.trigger('initForm');
      this.trigger('fetchOrgTree');
      this.trigger('fetchIndicatorType');
      this.trigger('renderTable');
    },

    initForm: function () {
      var _this = this;
      this.indicatorTypes = $('#indicatorTypes').select({
        placeholder: '规则类型',
        data: ['规则类型']
      });

      $('#indicatorTypes').on('bs.select.change', function (e, item) {
        _this.trigger('updateTable', _this.lastTreeId);
      });
    },

    // 获取组织考核指标类型列表
    fetchIndicatorType: function () {
      var _this = this;
      $.ajax({
        url: '/bi/orgCheck/indicatorTypeList.json',
        dataType: 'JSON'
      }).done(function (res) {
        if (res.status) {
          alert(res.errors[0].errorDesc);
          return;
        }
        var data = res.data;

        $.each(data, function (index, item) {
          item['name'] = item['alias'];
          item['id'] = item['value'];
        });

        _this.indicatorTypes.option.data = data;
        _this.indicatorTypes.render();

        _this.indicatorTypes.setValue(data[0]);
        if (_this.lastTreeId) {
          _this.trigger('updateTable', _this.lastTreeId);
        }
      });
    },

    // 获取组织浮动指标设置列表
    fetchFloatSeting: function () {
      var _this = this;
      var title = '';
      $.ajax({
        url: '/bi/settings/orgFloatCoefficientSettings/list.json',
        dataType: 'JSON',
        data: {
          indicatorType: _this.indicatorTypes.value.id
        }
      }).done(function (res) {
        if (res.status) {
          alert(res.errors[0].errorDesc);
          return;
        }

        var data;

        if (res.data) {
          data = res.data;
          // } else {
          //   data = {};
        }


        var name = _this.indicatorTypes.value.name;
        if (data) {
          data.name = name;
        }

        if (_this.indicatorTypes.value.id === 5) {
          if (data) {
            data.indicatorTypes = 5;
          }
          _this.trigger('renderDialog', {
            html: dialogChangeTpl(data),
            name: name,
            type: 'save'
          });
          return;
        }

        // console.log(res);
        _this.trigger('renderDialog', {
          html: dialogSetTpl(data),
          name: name,
          type: 'save'
        });
      });
    },

    // 获取组织树
    fetchOrgTree: function () {
      var _this = this;
      $.ajax({
        url: '/bi/common/orgTreeList.json',
        dataType: 'JSON',
        data: { maxOrgType: 3 }
      }).done(function (res) {
        if (res.status) {
          alert(res.errors[0].errorDesc);
          return;
        }

        _this.trigger('renderTree', res.data);
        _this.lastTreeId = res.data[0].id;
        if (_this.indicatorTypes.value.id) {
          _this.trigger('updateTable', _this.lastTreeId);
        }
      });
    },

    // 渲染组织树
    renderTree: function (data) {
      var _this = this;
      var setting = {
        data: {
          simpleData: {
            enable: true,
            pIdKey: 'pid'
          }
        },
        view: {
          selectedMulti: false
        },
        callback: {
          onClick: function (event, treeId, treeNode, clickFlag) {
            _this.lastTreeId = treeNode.id;
            _this.trigger('updateTable', treeNode.id);
          }
        }
      };

      // console.log(data);
      $.fn.zTree.init(this.$('#orgList'), setting, data);
    },

    // 渲染浮动指标数据
    renderTable: function () {
      var _this = this;
      this.list = this.$('#list').table({
        cols: [{
          title: '组织名称',
          name: 'orgName',
          align: 'center',
          width: 120,
          lockWidth: true
        }, {
          title: '考核月份',
          name: 'checkMonthYM',
          align: 'center',
          width: 80,
          lockWidth: true
        }, {
          title: '参考指标',
          name: 'greenThreshold',
          align: 'center',
          width: 120,
          lockWidth: true,
          renderer: function (val, item, rowIndex) {
            var str = _this.formatValue(val) + '%';
            if (item.canModify) {
              str = '<span class="red">' + str + '</span>'
            }
            return str;
          }
        }, {
          title: '绿灯范围',
          name: 'greenThreshold',
          align: 'center',
          width: 120,
          lockWidth: true,
          renderer: function (val, item, rowIndex) {
            return '大于' + _this.formatValue(val) + '%';
          }
        }, {
          title: '黄灯范围',
          name: 'greenThreshold',
          align: 'center',
          width: 150,
          lockWidth: true,
          renderer: function (val, item, rowIndex) {
            return _this.formatValue(item.yellowThreshold) + '%至' + _this.formatValue(val) + '%之间';
          }
        }, {
          title: '红灯范围',
          name: 'yellowThreshold',
          align: 'center',
          width: 120,
          lockWidth: true,
          renderer: function (val, item, rowIndex) {
            return '小于' + _this.formatValue(val) + '%';
          }
        }, {
          title: '操作',
          name: 'canModify',
          align: 'center',
          width: 60,
          lockWidth: true,
          renderer: function (val, item, rowIndex) {
            return val ? '<a href="javascript:;" data-index="' + rowIndex + '" class="js-dialog-change">修改</a>' : '';
          }
        }],
        autoLoad: false,
        height: 'auto',
        method: 'get',
        root: 'data',
        url: '/bi/settings/orgCheckSettings/list.json',
        indexCol: true,
        noDataText: '',
        indexColWidth: 60,
        showBackboard: false
      }).on('loadSuccess', function (e, data) {
        var $grid = $(this).closest('.mmGrid');
        $grid.removeClass('table-no-data');
        $grid.find('th').eq(0).find('.mmg-title').text('序号');
        !data.data[0] && $grid.addClass('table-no-data');
      });
    },

    // 更新表格
    updateTable: function (id) {
      this.orgId = id;
      this.list.load({
        indicatorType: this.indicatorTypes.value.id,
        orgId: id
      });
    },

    // 渲染弹出层
    renderDialog: function (opt) {
      var _this = this;

      var dialog = BootstrapDialog.show({
        title: opt.name + '预警规则',
        closeByBackdrop: false,
        closeByKeyboard: false,
        size: BootstrapDialog.SIZE_LARGE,
        message: opt.html
      });

      var container = dialog.$modalDialog;

      container.find('#cancel').on('click.close', function () {
        dialog.close();
      });

      container.find('#save').on('click.save', function () {
        var data = [{
          id: container.find('#id').val()
        }];
        var inputs = container.find('.in-int:enabled');
        var length = inputs.length;
        var obj = data[0];
        for (var i = 0; i < length; i++) {
          var $el = inputs.eq(i);
          if (!_this.limitNumber($el)) {
            alert('请输入正确的数字，范围 0~100！');
            $el.css('border', '1px solid #ff4a51');
            return;
          } else {
            obj[$el.attr('id')] = $el.val();
          }
        }

        if (opt.type === 'batchSave') {
          obj.orgId = container.find('#orgId').val();
        }
        container.find('.js-input').each(function () {
          var $el = $(this);
          obj[$el.attr('id')] = $el.val();
        });

        console.log(data);
        _this.trigger(opt.type, {
          data: data,
          callback: function () {
            dialog.close();
          }
        });

      });

      container.find('.in-int:enabled').on('input.inInt', function () {
        var $el = $(this);
        $el.css('border', '1px solid #ccc');
        _this.trigger('inInt', this);
        $('#' + $el.attr('id') + 'r').val(this.value);
      });

    },

    // inFloat: function (el) {
    //   $(el).val($(el).val().replace(/[^\d.]/g, ''));
    // },

    inInt: function (el) {
      $(el).val($(el).val().replace(/\D/g, ''));
    },

    save: function (opt) {
      // 预警规则设置
      $.ajax({
        url: '/bi/settings/orgFloatCoefficientSettings/modify.json',
        type: 'POST',
        dataType: 'JSON',
        data: {
          indicatorType: this.indicatorTypes.value.id,
          orgFloatCoefficientSettingsList: JSON.stringify(opt.data)
        }
      }).then(function (res) {
        if (res.status) {
          alert(res.errors[0].errorDesc);
          return;
        }

        if ($.isFunction(opt.callback)) {
          opt.callback();
        }
      });
    },
    batchSave: function (opt) {
      var _this = this;
      // 表格操作 修改
      $.ajax({
        url: '/bi/settings/orgCheckSettings/batchSave.json',
        type: 'POST',
        data: {
          indicatorType: _this.indicatorTypes.value.id,
          orgCheckSettingsList: JSON.stringify(opt.data)
        }
      }).done(function (res) {
        if (res.status) {
          alert(res.errors[0].errorDesc);
          return;
        }
        console.log(opt.index);

        // 修改之后刷新整个表格
        _this.list.load({
          indicatorType: _this.indicatorTypes.value.id,
          orgId: _this.orgId
        });

        if ($.isFunction(opt.callback)) {
          opt.callback();
        }

      });
    }
  },

  events: {
    'click #indicators': 'indicators',
    'click .js-dialog-change': 'dialogChange'
  },

  handle: {
    // 浮动指标设置
    indicators: function () {
      this.trigger('fetchFloatSeting');
    },
    dialogChange: function (e) {
      var $this = $(e.currentTarget);

      var index = $this.data('index');
      var data = this.list.row(index);
      console.log(data);
      data.index = index;
      data.name = this.indicatorTypes.value.name;
      if (this.indicatorTypes.value.id === 5) {
        data.indicatorTypes = 5;
      }
      this.trigger('renderDialog', {
        html: dialogChangeTpl(data),
        name: data.name,
        type: 'batchSave'
      });
    }
  },

  mixins: [{
    limitNumber: function (el) {
      var val = $(el).val();
      return val >= 0 && val <= 100;
    },
    formatValue: function (val) {
      if (!val) {
        return '';
      }
      val += '';
      var index = val.indexOf('.');
      if (index > -1 && val.length > index + 3) {
        val = (+val).toFixed(2);
      }
      return +val;
    }
  }]
};
