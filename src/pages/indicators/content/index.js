var coala = require('coala');

var config = require('config');
require('assets/vendors/ztree/css/zTreeStyle.css');
require('assets/vendors/ztree/js/jquery.ztree.all.min.js');

var tpl = require('./index.html');
require('./index.css');

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
        placeholder: '浮动指标设置',
        data: ['浮动指标设置']
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
        // console.log(res);
        _this.trigger('renderDialog', {
          data: res.data
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
          width: 200,
          lockWidth: true
        }, {
          title: '考核月份',
          name: 'checkMonthYM',
          align: 'center',
          width: 150,
          lockWidth: true
        }, {
          //   title: '近12个月平均市占',
          //   name: 'referThreshold',
          //   align: 'center',
          //   width: 140,
          //   lockWidth: true,
          //   renderer: function(val, item, rowIndex) {
          //     return val ? ((+val).toFixed(2) + '%') : '';
          //   }
          // }, {
          title: '考核指标',
          name: 'realThreshold',
          align: 'center',
          width: 140,
          lockWidth: true,
          renderer: function (val, item, rowIndex) {
            val = val ? +val.toFixed(2) : '';
            if (!item.canModify) {
              return val ? (val + '%') : '';
            }

            return _this.editInput(val, rowIndex, 'float');
          }
          // }, {
          // title: '报盘率考核指标',
          // name: 'realThreshold',
          // align: 'center',
          // width: 140,
          // lockWidth: true,
          // renderer: function (val, item, rowIndex) {
          //   val = val ? +val.toFixed(2) : '';
          //   if (!item.canModify) {
          //     return val ? (val + '%') : '';
          //   }

          //   return _this.editInput(val, rowIndex, 'float');
          // }
          // }, {
          //   title: '浮动指标',
          //   name: 'floatCoefficient',
          //   align: 'center',
          //   lockDisplay: true,
          //   width: 140,
          //   lockWidth: true,
          //   sortable: true,
          //   type: 'number',
          //   renderer: function(val, item, rowIndex) {
          //     val = val ? +val.toFixed(2) : '';
          //     if (!item.canModify) {
          //       return val ? (val +'%'):'';
          //     }

          //     return _this.editInput(val, rowIndex, 'int');
          //   }
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
      var data = opt.data;
      var _this = this;
      var _html = '<section class="in-dialog"><main>';
      var length = data.length;
      for (var i = 0; i < length; i++) {
        var item = data[i];
        var temp = '';

        _html += '<div class="in-item"><label for="inputbcity">' + item.orgTypeName + '</label><div class="in-box"><input class="form-control in-int" type="text" id="' + item.id + '" maxlength="3" value="' + item.defaultFloatCoefficient + '"><span class="in-unit">%</span></div></div>'

      }

      if(length > 0 ){
      _html += '</main><footer class="flexbox"><button type="button" id="save" class="btn btn-primary">保存</button><button type="button" id="cancel" class="btn btn-default">取消</button></footer></section>';
      }else{
        _html += '<p>暂无数据</p></main>';
      }

      var dialog = BootstrapDialog.show({
        title: _this.indicatorTypes.value.name + '浮动指标设置',//'浮动指标设置'
        closeByBackdrop: false,
        closeByKeyboard: false,
        size: BootstrapDialog.SIZE_SMALL,
        message: _html
      });

      var container = dialog.$modalDialog;

      container.find('#cancel').on('click.close', function () {
        dialog.close();
      });

      container.find('#save').on('click.save', function () {
        var data = [];
        var inputs = container.find('.in-int');
        var length = inputs.length;
        for (var i = 0; i < length; i++) {
          var $el = inputs.eq(i);
          if (!_this.limitNumber($el)) {
            alert('请输入正确的浮动指标，范围 0~100！');
            $el.css('border', '1px solid #ff4a51');
            return;
          } else {
            data.push({
              id: $el.attr('id'),
              defaultFloatCoefficient: $el.val()
            });
          }
        }
        _this.trigger('save', data, function () {
          dialog.close();
        });

      });

      container.find('.in-int').on('input.inInt', function () {
        $(this).css('border', '1px solid #ccc');
        _this.trigger('inInt', this);
      });

    },

    inFloat: function (el) {
      $(el).val($(el).val().replace(/[^\d.]/g, ''));
    },

    inInt: function (el) {
      $(el).val($(el).val().replace(/\D/g, ''));
    },

    save: function (data, callback) {
      $.ajax({
        url: '/bi/settings/orgFloatCoefficientSettings/modify.json',
        type: 'POST',
        dataType: 'JSON',
        data: {
          indicatorType: this.indicatorTypes.value.id,
          orgFloatCoefficientSettingsList: JSON.stringify(data)
        }
      }).then(function (res) {
        if (res.status) {
          alert(res.errors[0].errorDesc);
          return;
        }

        if ($.isFunction(callback)) {
          callback();
        }
      });
    }
  },

  events: {
    'click #indicators': 'indicators',
    // 'click #indicatorsf': 'indicatorsf',
    'input .in-int': 'inIntInput',
    'blur .in-int': 'inIntBlur',
    // 'click #saveTable': 'saveTable'
  },

  handle: {
    // 浮动指标设置
    indicators: function () {
      this.trigger('fetchFloatSeting');
    },
    // indicatorsf: function () {
    //   this.trigger('fetchFloatSeting', 2);
    // },

    inIntInput: function (e) {
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
    inIntBlur: function (e) {
      var _this = this;
      var $input = $(e.currentTarget);
      if (!this.limitNumber($input)) {
        alert('请输入正确的指标，范围 0~100！');
        $input.val($input.attr('value'));
        $input.attr('change', false);
      }

      var setting;
      if ($input.attr('change')) {
        // inputs = input.closest('tr').find('input');
        // setting = this.list.row($(inputs[0]).data('index'));
        // setting.realThreshold = +$(inputs[0]).val();
        // setting.floatCoefficient = +$(inputs[1]).val();

        setting = this.list.row($input.eq(0).data('index'));
        delete setting.canModify;
        setting.realThreshold = +$($input[0]).val();

        // 修改组织考核设置 提交
        $.ajax({
          url: '/bi/settings/orgCheckSettings/batchSave.json',
          type: 'POST',
          data: {
            indicatorType: _this.indicatorTypes.value.id,
            orgCheckSettingsList: JSON.stringify([setting])
          }
        }).done(function (res) {
          if (res.status) {
            alert(res.errors[0].errorDesc);
            return;
          }
          // _this.trigger('up');
        });
      }

      // },

      // saveTable: function () {
      //   var _this = this;
      //   var $trs = $('#list').find('tr');
      //   var first = true;
      //   var len = $trs.length;
      //   var i;
      //   var setting = [];
      //   for (i = 0; i < len; i++) {
      //     var $inputs = $trs.eq(i).find('input');
      //     var data;
      //     if (!$inputs.length) {
      //       continue;
      //     }

      //     $inputs.each(function (index, val) {
      //       if (!_this.limitNumber(val)) {
      //         $(val).css('border', '1px solid #ff4a51');
      //         if (first) {
      //           alert('请输入正确的指标，范围 0~100！');
      //           first = false;
      //           setting = [];
      //         }
      //       }
      //     });

      //     if (first) {
      //       data = this.list.row($inputs.eq(0).data('index'));
      //       data.realThreshold = +$inputs.eq(0).val();
      //       data.floatCoefficient = +$inputs.eq(1).val();
      //       setting.push(data);
      //     }

      //   }

      //   if (setting.length) {

      //     // 修改组织考核设置 提交
      //     $.ajax({
      //       url: '/bi/settings/orgCheckSettings/batchSave.json',
      //       type: 'POST',
      //       data: {
      //         orgCheckSettingsList: JSON.stringify(setting)
      //       }
      //     }).done(function (res) {
      //       if (res.status) {
      //         alert(res.errors[0].errorDesc);
      //         return;
      //       }

      //       _this.trigger('updateTable', _this.orgId);
      //     });

      //   }

    }
  },

  mixins: [{
    editInput: function (val, index, type) {
      return '<div class="in-box"><input class="form-control in-int" type="text" value="' + val + '" data-index="' + index + '" data-type="' + type + '" autocomplete="off"><span class="in-unit">%</span></div>';
    },
    limitNumber: function (el) {
      var val = $(el).val();
      return val >= 0 && val <= 100;
    }
  }]
};
