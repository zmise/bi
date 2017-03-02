var dattrs = ['wsCountList', 'gtCountList', 'rateList'];

function countMonth(opts) {
  var lastMoth = opts.lastMoth;
  var data = opts.data;
  var month = data.statMonthList;
  var index = month.length - 1;
  var temp = month[index];
  var monthCount = opts.monthCount || 6;

  // 数组最后一个不是搜索月份，填充到搜索月份
  var difm = diffM(temp, lastMoth);
  while (difm > 0) {
    var next = getDStr(new Date(month[month.length - 1]));
    month.push(next);
    setData(data, month.length)
    difm = diffM(next, lastMoth);
    month = cutArr(month, monthCount);
    cutData(data, monthCount);
    index = month.indexOf(temp);
  }

  // 中间

  while (index >= 0) {
    var item = month[index];
    difm = diffM(item, temp);
    if (difm > 1) {
      var prev = getDStr(new Date(temp), true);
      month.splice(index + 1, 0, prev);
      setData(data, index + 1);
      month = cutArr(month, monthCount);
      cutData(data, monthCount);
      index = month.indexOf(item);
      temp = prev;
    } else {
      temp = item;
      index--;
    }
  }

  // 如果长度不够 ， 填充前面
  while (month.length < monthCount) {
    var prev = getDStr(new Date(temp), true);
    month.unshift(prev);
    setData(data);
    temp = prev;
  }

  data.statMonthList = month;
}

// 对data 进行操作
function setData(data, index) {
  var len = dattrs.length;
  while (len--) {
    setArr(data[dattrs[len]], index);
  }
}
// 对data 进行操作
function cutData(data, count) {
  var len = dattrs.length;
  while (len--) {
    data[dattrs[len]] = cutArr(data[dattrs[len]], count);
  }
}

// 填充数据
function setArr(arr, index) {
  if (index >= 0) {
    arr.splice(index, 0, undefined);
  } else {
    arr.unshift(undefined);
  }
}

// 如果长度超出，则截取后面数据
function cutArr(arr, count) {
  var len = dattrs.length;
  if (arr.length > count) {
    return arr.slice(-count);
  }
  return arr;
}

// 返回年月字符串
function getDStr(date, prev) {
  if (prev) {
    date.setMonth(date.getMonth() - 1);
  } else {
    date.setMonth(date.getMonth() + 1);
  }
  return date.getFullYear() + '-' + ('0' + (date.getMonth() + 1)).substr(-2);
}

// 两个月份差
function diffM(sd, ed) {
  if (sd && ed) {
    sd = new Date(sd);
    ed = new Date(ed);
    return (ed.getYear() - sd.getYear()) * 12 + (ed.getMonth() - sd.getMonth());
  }
}
module.exports = countMonth;
