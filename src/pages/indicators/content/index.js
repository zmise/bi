var coala = require('coala');

var config = require('config');
require('assets/vendors/ztree/css/zTreeStyle.css');
require('assets/vendors/ztree/js/jquery.ztree.all.min.js');

var tpl = require('./index.html');
require('./index.css');

module.exports = {
  tpl: tpl,
  listen: {
    mount: function() {
      this.trigger('fetchOrgTree');
      this.trigger('renderTable');
    },

    // 获取组织浮动指标设置列表
    fetchFloatSeting: function() {
      var _this = this;
      $.ajax({
        url: '/bi/settings/orgFloatCoefficientSettings/list.json',
        dataType: 'JSON'
      }).done(function(res) {
        if (res.status) {
          alert(res.errors[0].errorDesc);
          return;
        }
        // console.log(res);
        _this.trigger('renderDialog', res.data);
      });
    },

    // 获取组织树
    fetchOrgTree: function() {
      var _this = this;
      $.ajax({
        url: '/bi/common/orgTreeList.json',
        dataType: 'JSON',
        data: { maxOrgType: 3 }
      }).done(function(res) {
        if (res.status) {
          alert(res.errors[0].errorDesc);
          return;
        }

        _this.trigger('renderTree', res.data);
        _this.trigger('updateTable', res.data[0].id);
      });
    },

    // 渲染组织树
    renderTree: function(data) {
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
          onClick: function(event, treeId, treeNode, clickFlag) {
            _this.trigger('updateTable', treeNode.id);
          }
        }
      };

      // console.log(data);
      $.fn.zTree.init(this.$('#orgList'), setting, data);
    },

    // 渲染浮动指标数据
    renderTable: function() {
      var _this = this;
      this.list = this.$('#list').table({
        cols: [{
          title: '组织名称',
          name: 'orgName',
          align: 'center',
          width: 200,
          lockWidth: true
        }, {
          title: '考核月份',
          name: 'checkMonthYM',
          align: 'center',
          width: 150,
          lockWidth: true
        }, {
          title: '参考考核指标',
          name: 'referThreshold',
          align: 'center',
          width: 140,
          lockWidth: true,
          renderer: function(val, item, rowIndex) {
            return val ? (val + '%') : '';
          }
        }, {
          title: '实际考核指标',
          name: 'realThreshold',
          align: 'center',
          width: 140,
          lockWidth: true,
          renderer: function(val, item, rowIndex) {
            if (!item.canModify) {
              return val ? (val + '%') : '';
            }

            return _this.editInput(val, rowIndex, 'float');
          }
        }, {
          title: '浮动指标',
          name: 'floatCoefficient',
          align: 'center',
          lockDisplay: true,
          width: 140,
          lockWidth: true,
          sortable: true,
          type: 'number',
          renderer: function(val, item, rowIndex) {
            if (!item.canModify) {
              return val ? (val + '%') : '';
            }

            return _this.editInput(val, rowIndex, 'int');
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
      }).on('loadSuccess', function(e, data) {
        var $grid = $(this).closest('.mmGrid');
        $grid.removeClass('table-no-data');
        $grid.find('th').eq(0).find('.mmg-title').text('序号');
        !data.data[0] && $grid.addClass('table-no-data');
      });
    },

    // 更新表格
    updateTable: function(id) {
      this.list.load({
        orgId: id
      });
    },

    // 渲染弹出层
    renderDialog: function(data) {
      var _this = this;
      var dialog = BootstrapDialog.show({
        title: '浮动指标设置',
        closeByBackdrop: false,
        closeByKeyboard: false,
        size: BootstrapDialog.SIZE_SMALL,
        message: $('#inDialog').html()
      });

      var container = dialog.$modalDialog;
      var inputs = container.find('.in-int');
      var length = data.length;
      for (var i = 0; i < length; i++) {
        var temp = inputs.eq(data[i].orgTypeValue - 1);
        if (!temp) {
          continue;
        }

        temp.data('id', data[i].id);
        temp.val(data[i].defaultFloatCoefficient);
      }

      container.find('#cancel').on('click.close', function() {
        dialog.close();
      });

      container.find('#save').on('click.save', function() {
        var data = [];
        var length = inputs.length;
        for (var i = 0; i < length; i++) {
          var $el = inputs.eq(i);
          if (!_this.limitNumber($el)) {
            alert('请输入正确的浮动指标，范围 0~100！');
            $el.css('border', '1px solid #ff4a51');
            return;
          } else {
            data.push({
              id: $el.data('id'),
              defaultFloatCoefficient: $el.val()
            });
          }
        }
        _this.trigger('save', data, function() { dialog.close(); });

      });

      inputs.on('input.inInt', function() {
        $(this).css('border', '1px solid #ccc');
        _this.trigger('inInt', this);
      });

    },

    inFloat: function(el) {
      $(el).val($(el).val().replace(/[^\d]\./g, ''));
    },

    inInt: function(el) {
      $(el).val($(el).val().replace(/[^\d]/g, ''));
    },

    save: function(data, callback) {
      $.ajax({
        url: '/bi/settings/orgFloatCoefficientSettings/modify.json',
        type: 'POST',
        dataType: 'JSON',
        data: {
          orgFloatCoefficientSettingsList: JSON.stringify(data)
        }
      }).then(function(res) {
        if (res.status) {
          alert(res.errors[0].errorDesc);
          return;
        }

        if ('function' === typeof callback) {
          callback();
        }
      });
    }
  },

  events: {
    'click #indicators': 'indicators',
    'input .in-int': 'inIntInput',
    // 'blur .in-int': 'inIntBlur',
    'click #saveTable': 'saveTable'
  },

  handle: {
    // 浮动指标设置
    indicators: function() {
      this.trigger('fetchFloatSeting');
    },

    inIntInput: function(e) {
      var $input = $(e.currentTarget);
      var type = $input.data('type');
      if (type === 'float') {
        this.trigger('inFloat', $input);
      } else {
        this.trigger('inInt', $input);
      }

      $input.attr('change', true).css('border', '');
    },

    // // 失去焦点时进行操作
    // inIntBlur: function(e) {
    //   var _this = this;
    //   var input = $(e.currentTarget);
    //   if (!this.limitNumber(input)) {
    //     alert('请输入正确的指标，范围 0~100！');
    //     input.val(input.attr('value'));
    //     input.attr('change', false);
    //   }

    //   var inputs;
    //   var realThreshold;
    //   var floatCoefficient;
    //   var setting;
    //   if (input.attr('change')) {
    //     inputs = input.closest('tr').find('input');
    //     setting = this.list.row($(inputs[0]).data('index'));
    //     setting.realThreshold = +$(inputs[0]).val();
    //     setting.floatCoefficient = +$(inputs[1]).val();

    //     // 修改组织考核设置 提交
    //     $.ajax({
    //       url: '/bi/settings/orgCheckSettings/batchSave.json',
    //       type: 'POST',
    //       data: {
    //         orgCheckSettingsList: JSON.stringify([setting])
    //       }
    //     }).done(function(res) {
    //       if (res.status) {
    //         alert(res.errors[0].errorDesc);
    //         return;
    //       }
    //       // _this.trigger('up');
    //     });
    //   }

    // },

    saveTable: function() {
      var _this = this;
      var $trs = $('#list').find('tr');
      var first = true;
      var len = $trs.length;
      var i;
      var setting = [];
      for (i = 0; i < len; i++) {
        var $inputs = $trs.eq(i).find('input');
        var data;
        if (!$inputs.length) {
          continue;
        }

        $inputs.each(function(index, val) {
          if (!_this.limitNumber(val)) {
            $(val).css('border', '1px solid #ff4a51');
            if (first) {
              alert('请输入正确的指标，范围 0~100！');
              first = false;
              setting = [];
            }
          }
        });

        if (first) {
          data = this.list.row($inputs.eq(0).data('index'));
          data.realThreshold = +$inputs.eq(0).val();
          data.floatCoefficient = +$inputs.eq(1).val();
          setting.push(data);
        }

      }

      if (setting.length) {

        // 修改组织考核设置 提交
        $.ajax({
          url: '/bi/settings/orgCheckSettings/batchSave.json',
          type: 'POST',
          data: {
            orgCheckSettingsList: JSON.stringify(setting)
          }
        }).done(function(res) {
          if (res.status) {
            alert(res.errors[0].errorDesc);
            return;
          }

          _this.list.load();
        });

      }

    }
  },

  mixins: [{
    editInput: function(val, index, type) {
      return '<div class="in-box"><input class="form-control in-int" type="text" value="' + val + '" data-index="' + index + '" data-type="' + type + '" autocomplete="off"><span class="in-unit">%</span></div>';
    },
    limitNumber: function(el) {
      var val = $(el).val();
      return val >= 0 && val <= 100;
    }
  }]
};
