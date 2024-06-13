const fs = require('fs').promises;
const path = require('path');

/**
 * 日期格式化
 */
exports.formatDate = (day, fmt, timestamp) => {
  let now = (timestamp ? new Date(timestamp).getTime() : new Date().getTime()); 
  let recent = new Date(now + day * 24 * 60 * 60 * 1000);
  // let time;
  // (timestamp) ? time = new Date(timestamp) : time = new Date();
  var o = {
    "M+": recent.getMonth() + 1, //月份
    "d+": recent.getDate(), //日
    "h+": recent.getHours(), //小时
    "m+": recent.getMinutes(), //分
    "s+": recent.getSeconds(), //秒
    "q+": Math.floor((recent.getMonth() + 3) / 3), //季度
    "S": recent.getMilliseconds() //毫秒
  };
  if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (recent.getFullYear() + "").substr(4 - RegExp.$1.length));
  for (var k in o)
    if (new RegExp("(" + k + ")").test(fmt)) fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
  return fmt;
}
/**
 * 判断文件是否存在
 */
exports.existsFiles = async (filePath, fileName) => {
  try {
    await fs.access(path.join(filePath, fileName));
    return true;
  } catch(e) {
    return false;
  }
}
/**
 * 读取文件夹中的所有文件名
 */
exports.readDir = async (filePath) => {
  return fs.readdir(filePath);
}
/**
 * 写文件
 */
exports.writeFiles = async (filePath, fileName, content) => {
  if(typeof content !== 'string') throw new Error('文件写入格式不对')
  return fs.writeFile(path.join(filePath, fileName), content, { encoding: 'utf-8' });
}
/**
 * 追加文件
 */
exports.appendFiles = async (filePath, fileName, content) => {
  return fs.appendFile(path.join(filePath, fileName), content, { encoding: 'utf-8' });
}
/**
 * 删除文件
 */
exports.deleteFiles = async (filePath, fileName) => {
  const is_exists = await this.existsFiles(filePath, fileName)
  if(is_exists) fs.unlink(path.join(filePath, fileName));
  return;
}
/**
 * 读文件
 */
exports.readFiles = async (filePath, fileName) => {
  return fs.readFile(path.join(filePath, fileName))
}
/**
 * 文件备份
 */
exports.backupFiles = async (filePath, sourceName, destName) => {
  const source = path.join(filePath, sourceName);
  const dest = path.join(filePath, destName);
  return await fs.cp(source, dest);
}
/**
 * 字符串去除首尾空格及换行符
 */
exports.stringTrimLine = (str) => {
  return str.replace(/^\s+|\s+$/g, "").replace(/[\r\n]+/g, " ");
}