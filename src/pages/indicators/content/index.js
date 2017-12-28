var coala = require('coala');

var config = require('config');
require('assets/vendors/ztree/css/zTreeStyle.css');
require('assets/vendors/ztree/js/jquery.ztree.all.min.js');

var tpl = require('./index.html');
require('./index.css');
var dialogSetTpl = require('./dialog-set.html');
var dialogChangeTpl = require('./dialog-change.html');
var dialogStaffTpl = require('./dialog-broker.html');
var dialogAchTpl = require('./dialog-ach.html');

module.exports = {
  tpl: tpl,
  listen: {

    mount: function () {
      this.trigger('initForm');
      this.trigger('renderTable');
      this.trigger('fetchIndicatorType');
      this.trigger('renderTree');
      // this.trigger('fetchOrgTree');

    },

    initForm: function () {
      var _this = this;
      this.unit = '%';
      this.indicatorTypes = $('#indicatorTypes').select({
        placeholder: '规则类型',
        data: ['规则类型']
      });

      $('#indicatorTypes').on('bs.select.change', function (e, item) {
        console.log(item);
        if (item.id === 8 || item.id === 9) {
          _this.unit = '人';
        } else if (item.id === 7) {
          _this.unit = '万';
        } else {
          _this.unit = '%';
        }
        _this.trigger('updateTable');
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
          _this.trigger('updateTable');
        }
      });
    },

    // 获取组织浮动指标设置列表
    fetchFloatSeting: function () {
      var _this = this;
      var title = '';
      var indicatorType = _this.indicatorTypes.value.id;
      var name = _this.indicatorTypes.value.name;
      $.ajax({
        url: '/bi/settings/orgFloatCoefficientSettings/list.json',
        dataType: 'JSON',
        data: {
          indicatorType: indicatorType,
          cityOrgId: _this.lastTreeId
        }
      }).done(function (res) {
        _this.$('#indicators').data('loading', '');
        if (res.status) {
          alert(res.errors[0].errorDesc);
          return;
        }

        var data;

        if (res.data) {
          data = res.data;
        }


        if (data) {
          data.name = name;
          data.cityOrgId = _this.lastTreeId;
          data.indicatorTypes = indicatorType;
        }

        if (indicatorType === 5) {
          _this.trigger('renderDialog', {
            html: dialogChangeTpl(data),
            name: name,
            type: 'save'
          });
          return;
        }

        if (indicatorType === 8) {
          _this.trigger('renderDialog', {
            html: dialogStaffTpl(data),
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

    // 渲染组织树
    renderTree: function () {
      this.$('#orgList').height($(window).height() - 150);
      var _this = this;
      var setting = {
        async: {
          enable: true,
          url: "/bi/common/orgList.json",
          type: 'get',
          dataType: 'JSON',
          autoParam: ["orgType", "longNumber=parentLongNumbers"],
          otherParam: { orgType: 1, notPermissionControl: true },
          dataFilter: function (treeId, parentNode, childNodes) {
            if (childNodes.status) return null;
            childNodes = childNodes.data;
            for (var i = 0, l = childNodes.length; i < l; i++) {
              childNodes[i].isParent = childNodes[i].orgType !== 5;
            }
            // console.log(childNodes);
            return childNodes;
          }
        },
        // data: {
        //   simpleData: {
        //     enable: true,
        //     pIdKey: 'pid'
        //   }
        // },
        view: {
          selectedMulti: false
        },
        callback: {
          onClick: function (event, treeId, treeNode, clickFlag) {
            // console.log(treeNode);
            _this.$('#indicators').toggle(treeNode.orgType === 1);
            _this.lastTreeId = treeNode.id;
            _this.trigger('updateTable');
          },
          beforeAsync: function (treeId, treeNode) {
            if (treeNode) {
              delete $.fn.zTree.getZTreeObj("orgList").setting.async.otherParam.orgType;
              treeNode.orgType = treeNode.orgType + 1;
              // debugger
            }

          },
          onAsyncSuccess: function (event, treeId, treeNode, msg) {
            // console.log(event, treeId, treeNode, msg);
            if (!treeNode) {
              var treeObj = $.fn.zTree.getZTreeObj("orgList");
              var nodes = treeObj.getNodes();
              if (nodes.length > 0) {
                treeObj.selectNode(nodes[0]);
              }

              _this.lastTreeId = nodes[0].id;
              if (_this.indicatorTypes.value) {
                _this.trigger('updateTable');
              }

            } else {
              treeNode.orgType = treeNode.orgType - 1;
              // 没有大区的时候请求片区
              if (!msg.status && msg.data.length === 0 && treeNode.orgType === 1) {
                $.ajax({
                  url: '/bi/common/orgList.json',
                  dataType: 'JSON',
                  data: {
                    orgType: 3,
                    parentLongNumbers: treeNode.longNumber,
                    notPermissionControl: true
                  }
                }).done(function (res) {
                  if (res.status) {
                    return;
                  }
                  // console.log(res);
                  var data = res.data;
                  for (var i = 0, l = data.length; i < l; i++) {
                    data[i].isParent = data[i].orgType !== 5;
                  }
                  $.fn.zTree.getZTreeObj("orgList").addNodes(treeNode, data);
                });

              }

            }
          }
        }
      };

      // console.log(data);
      this.tree = $.fn.zTree.init(this.$('#orgList'), setting);
      // console.log(this.tree);
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
            var str = _this.formatValue(val) + _this.unit;
            if (item.canModify) {
              str = '<span class="red">' + str + '</span>'
            }
            return val ? str : '';
          }
        }, {
          title: '绿灯范围',
          name: 'greenThreshold',
          align: 'center',
          width: 120,
          lockWidth: true,
          renderer: function (val, item, rowIndex) {
            return val ? '大于' + _this.formatValue(val) + _this.unit : '';
          }
        }, {
          title: '黄灯范围',
          name: 'greenThreshold',
          align: 'center',
          width: 170,
          lockWidth: true,
          renderer: function (val, item, rowIndex) {
            return val ? _this.formatValue(item.yellowThreshold) + _this.unit + '至' + _this.formatValue(val) + _this.unit : '';
          }
        }, {
          title: '红灯范围',
          name: 'yellowThreshold',
          align: 'center',
          width: 120,
          lockWidth: true,
          renderer: function (val, item, rowIndex) {
            return val ? '小于' + _this.formatValue(val) + _this.unit : '';
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
        params: function () {
          return {
            indicatorType: _this.indicatorTypes.value.id,
            orgId: _this.lastTreeId
          };
        },
        height: 'auto',
        method: 'get',
        root: 'data',
        url: '/bi/settings/orgCheckSettings/list.json',
        indexCol: true,
        noDataText: '',
        indexColWidth: 40,
        showBackboard: false
      }).on('loadSuccess', function (e, data) {
        var $grid = $(this).closest('.mmGrid');
        $grid.removeClass('table-no-data');
        $grid.find('th').eq(0).find('.mmg-title').text('序号');
        !data.data[0] && $grid.addClass('table-no-data');
      });
    },

    // 更新表格
    updateTable: function () {
      // this.list.load({
      //   indicatorType: this.indicatorTypes.value.id,
      //   orgId: this.lastTreeId
      // });
      this.list && this.list.load();
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

      container.find('#import').on('click.import', function () {
        _this.trigger('achDialog');
      });

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
            alert('请输入大于 0 的数字！');
            $el.css('border', '1px solid #ff4a51');
            return;
          } else {
            obj[$el.attr('id')] = $el.val();
          }
        }

        // if (opt.type === 'batchSave') {
        //   obj.cityOrgId = container.find('#cityOrgId').val();
        // }
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

    //业绩预警规则设置小弹窗
    achDialog(opt) {
      var _this = this;
      var data = this.tree.getSelectedNodes();

      var dialog = BootstrapDialog.show({
        title: '导入各组织实收保本点',
        closeByBackdrop: false,
        closeByKeyboard: false,
        size: BootstrapDialog.SIZE_NORMAL,
        message: dialogAchTpl(data[0])
      });


      var container = dialog.$modalDialog;
      container.find('#exportBtn').on('click.export', function () {
        window.open('/bi/marketing/org/achievement/exportAchievementThresholdList.excel?cityOrgLongNumber=' + data[0].longNumber, '_blank');
      });
      container.find('#cancel').on('click.close', function () {
        dialog.close();
      });
      container.find('#save').on('click.save', function () {
        if ($(this).data('lading') === '1') {
          alert('正在上传文件，请稍候！');
          return;
        }
        if ($('#importFile').val()) {
          $(this).closest('form').submit();
        } else {
          alert('请选择文件！');
          return;
        }
        $(this).data('lading', '1');
        console.log($("#hidden"));
        $("#hidden").load(function () {
          BootstrapDialog.success('导入成功！');
          dialog.close();
          //do something
        });
      });

      // var iframe = $('#hidden')[0];
      // document.getElementById('hidden').onload = function () {
      //   //here doc
      //   alert('00000000');
      // }

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
          cityOrgId: this.lastTreeId,
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
        // _this.list.load({
        //   indicatorType: _this.indicatorTypes.value.id,
        //   orgId: _this.lastTreeId
        // });
        _this.trigger('updateTable');

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
      if (!this.$('#indicators').data('loading')) {
        this.trigger('fetchFloatSeting');
        this.$('#indicators').data('loading', 'true');
      }
    },
    dialogChange: function (e) {
      var $this = $(e.currentTarget);

      var index = $this.data('index');
      var data = this.list.row(index);
      console.log(data);
      data.index = index;
      data.name = this.indicatorTypes.value.name;
      data.indicatorTypes = this.indicatorTypes.value.id;
      data.cityOrgId = this.lastTreeId;
      if (data.indicatorTypes === 8) {
        this.trigger('renderDialog', {
          html: dialogStaffTpl(data),
          name: data.name,
          type: 'batchSave'
        });
        return;
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
      // return val >= 0 && val <= 100;
      return val > 0;
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
