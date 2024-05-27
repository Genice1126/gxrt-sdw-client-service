const {formatDate} = require('../extend/helper');
module.exports = function () {
  return function (req, res, next) {
    req._startTime = new Date().getTime() // 获取时间 t1
    const callResponseTime = () => {
      let now = new Date().getTime();
      const deltaTime = now - req._startTime;
      console.log(`==================================`)
      console.log(`本次请求时间: ${formatDate(0,'yyyy-MM-dd hh:mm:ss', req._startTime)}`)
      console.log(`本次请求地址: ${req.originalUrl}`)
      console.log(`本次请求方法: ${req.method}`)
      console.log(`本次请求Body: ${JSON.stringify(req.body)}`)
      console.log(`本次请求结果: ${res.body}`)
      console.log(`本次请求耗时: ${deltaTime}ms`)
      console.log(`==================================`)
    }
    res.once('close', callResponseTime);
    return next();
 }
}