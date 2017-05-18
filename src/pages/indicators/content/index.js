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
        url: '/bi/orgCheck/orgFloatCoefficientSettingsList.json',
        dataType: 'JSON'
      }).done(function(res) {
        _this.trigger('renderDialog', res.data);
      });
    },
    fetchOrgTree: function() {
      var _this = this;
      $.ajax({
        url: '/bi/common/orgTreeList.json',
        dataType: 'JSON',
        data: { orgTypes: '1, 2, 3' }
      }).done(function(res) {
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

      console.log(data);
      $.fn.zTree.init( $('#orgList'), setting, data);
    },
    // 渲染浮动指标数据
    renderTable: function() {
      var _this = this;
      this.list = $('#list').table({
        cols: [{
          title: '组织名称',
          name: 'orgName',
          align: 'center',
          width: 260,
          lockWidth: true
        }, {
          title: '考核月份',
          name: 'checkMonth',
          align: 'center',
          width: 100,
          lockWidth: true
        }, {
          title: '参考考核指标',
          name: 'referThreshold',
          align: 'center',
          width: 140,
          lockWidth: true,
          renderer: function(val, item, rowIndex) {
            return val + '%';
          }
        }, {
          title: '实际考核指标',
          name: 'realThreshold',
          align: 'center',
          width: 140,
          lockWidth: true,
          renderer: function(val, item, rowIndex) {
            if (!item.canModify) {
              return val;
            }

            return '<div class="in-box"> <input class="form-control in-in" type="text" maxlength="5" value="' + val + '" data-id="' + item.id + '" data-type="float" autocomplete="off"> <span class="in-unit">%</span> </div>';
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
              return val;
            }

            return '<div class="in-box"> <input class="form-control in-in" type="text" maxlength="4" value="' + val + '" data-id="' + item.id + '" data-type="int" autocomplete="off"> <span class="in-unit">%</span> </div>';
          }
        }],
        autoLoad: false,
        height: $(document).height() - $('#orgList').offset().top - 30,
        method: 'get',
        root: 'data',
        url: '/bi/orgCheck/orgCheckSettingsList.json',
        indexCol: true,
        noDataText: '',
        indexColWidth: 60,
        showBackboard: false
      }).on('loadSuccess', function(e, data) {
        $(this).parent().removeClass('table-no-data');
        $(this).closest('.mmGrid').find('th:eq(0) .mmg-title').text('序号');
        !data && $(this).parent().addClass('table-no-data');
      });
    },
    updateTable: function(id) {
      this.list.load({
        orgId: id
      });
    },
    renderDialog: function(data) {
      var _this = this;
      var dialog = BootstrapDialog.show({
        title: '浮动指标设置',
        closeByBackdrop: false,
        closeByKeyboard: false,
        size: BootstrapDialog.SIZE_SMALL,
        message: $('#inDialog').html()
      });
      var cotnainer = dialog.$modalDialog;
      var inputs = cotnainer.find('.in-in');
      var length = data.length;
      for (var i = 0; i < length; i++) {
        var temp = inputs.eq(data[i].orgType - 1);
        if (!temp) {
          continune;
        }
        temp.data('id', data[i].id);
        temp.val(data[i].floatCoefficient);
      }

      cotnainer.find('#cancel').on('click.close', function() {
        dialog.close();
      });
      cotnainer.find('#save').on('click.save', function() {
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
              floatCoefficient: $el.val()
            });
          }
        }
        _this.trigger('save', data, function() { dialog.close(); });

      });
      inputs.on('input.inIn', function() {
        $(this).css('border', '1px solid #ccc');
        _this.trigger('inIn', this);
      });

    },
    inFloat: function(el) {
      $(el).val($(el).val().replace(/[^\d]\./g, ''));
    },
    inIn: function(el) {
      $(el).val($(el).val().replace(/[^\d]/g, ''));
    },
    save: function(data, callback) {
      $.ajax({
        url: '/bi/orgCheck/modifyOrgFloatCoefficientSettings.json',
        dataType: 'JSON',
        data: {
          orgFloatCoefficientSettingsList: JSON.stringify(data)
        }
      }).then(function(res) {
        if (res.staus) {
          alert(res.errorDesc);
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
    'input .in-in': 'inInInput',
    'blur .in-in': 'inInBlur'
  },
  handle: {
    // 浮动指标设置
    indicators: function() {
      this.trigger('fetchFloatSeting');
    },
    inInInput: function(e) {
      var input = $(e.currentTarget);
      var type = input.data('type');
      if (type === 'float') {
        this.trigger('inFloat', input);
      } else {
        this.trigger('inIn', input);
      }

      input.attr('change', true);
    },
    // 失去焦点时进行操作
    inInBlur: function(e) {
      var input = $(e.currentTarget);
      if (!this.limitNumber(input)) {
        alert('请输入正确的指标，范围 0~100！');
        input.val(input.attr('value'));
        input.attr('change', false);
      }

      var inputs;
      var realThreshold;
      var floatCoefficient;
      if (input.attr('change')) {
        inputs = input.closest('tr').find('input');
        realThreshold = $(inputs[0]);
        floatCoefficient = $(inputs[1]);
        // 修改组织考核设置 提交
        $.ajax({
          url: '/bi/orgCheck/modifyOrgCheckSettings.json',
          type: 'POST',
          data: {
            orgCheckSettingsId: realThreshold.data('id'),
            realThreshold: realThreshold.val(),
            floatCoefficient: floatCoefficient.val()
          }
        }).done(function(res) {
          console.log(res);
        });
      }

    }
  },
  mixins: [{
    limitNumber: function(el) {
      var val = $(el).val();
      return val >= 0 && val <= 100;
    }
  }]
};
