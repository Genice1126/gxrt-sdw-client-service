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
  fs.mkdir(filePath, {recursive: true});
  return fs.readdir(filePath);
}
/**
 * 写文件
 */
exports.writeFiles = async (filePath, fileName, content) => {
  if(typeof content !== 'string') throw new Error('文件写入格式不对')
  fs.mkdir(filePath, {recursive: true});
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

exports.pingExecRes = async (host) => {
  try {
    const isWin = process.platform === 'win32';
    const res = await ping.promise.probe(host, {
      timeout: 3,
      extra: [isWin ? '-n' : '-c', '10'] // 发10包
    });
    const parse = (val) => (isNaN(val) ? null : parseFloat(val).toFixed(2));
    if(res.alive) {
      return {
        status: true,
        detail: {
          delay: parse(res.avg),
          min: parse(res.min),
          max: parse(res.max),
          avg: parse(res.avg),
          stddev: parse(res.stddev),
          packetLoss: parse(res.packetLoss),
        }
      }
    } else {
      return {
        status: false,
        detail: {
          delay: LimitData.MonitorOvertime,
          min: null,
          max: null,
          avg: null,
          stddev: null,
          packetLoss: null,
        }
      }
    }
  } catch(e) {
    return {
      status: false,
      detail: {
        delay: LimitData.MonitorOvertime,
        min: null,
        max: null,
        avg: null,
        stddev: null,
        packetLoss: null,
      }
    }
  }
}

exports.tcpExecRes = async(host, port, retryCount = 0, timeout = 5000) => {
  const totalAttempts = Number(retryCount) + 1;
  const measureTcp = () => {
    return new Promise((resolve) => {
      const start = Date.now();
      const socket = new net.Socket();
      let resolved = false;

      const fail = (reason) => {
        if (!resolved) {
          resolved = true;
          socket.destroy();
          resolve({ success: false, delay: null, failReason: reason });
        }
      };

      socket.setTimeout(timeout);

      socket.connect(port, host, () => {
        const delay = Date.now() - start;
        socket.destroy();
        resolved = true;
        resolve({ success: true, delay, failReason: null });
      });

      socket.on('error', (err) => fail(err.message));
      socket.on('timeout', () => fail('timeout'));
    });
  };
  // 并发探测
  const probes = Array.from({ length: totalAttempts }, () => measureTcp());
  const results = await Promise.allSettled(probes);

  const samples = results.map((res) => {
    if (res.status === 'fulfilled') return res.value;
    return {
      success: false,
      delay: LimitData.MonitorOvertime,
      failReason: res.reason?.message || 'unknown error'
    };
  });
  const validDelays = samples.filter(s => s.success && s.delay !== null && s.delay >= 0).map(s => !s.delay);

  const avgDelay = validDelays.length > 0
    ? Math.round(validDelays.reduce((a, b) => a + b, 0) / validDelays.length)
    : null;

  return {
    status: avgDelay !== null,
    detail: {
      code: 200,
      delay: typeof avgDelay === 'number' ? Math.abs(avgDelay) : LimitData.MonitorOvertime,
      retryCount,
      timeout,
      successCount: validDelays.length,
      failCount: totalAttempts - validDelays.length,
      totalAttempts,
      samples
    }
  };
}

exports.urlExecRes = async(url, retryCount = 0, timeout = 5000) => {
  const start = Date.now();
  try {
    const response = await got.head(url, {
      timeout: { request: timeout },
      followRedirect: false,
      throwHttpErrors: false,
      retry: retryCount,
      agent: false,     // 禁用 keep-alive
      dnsCache: false,  // 禁用 DNS 缓存
      http2: false      // 避免 http2 多路复用隐藏建连阶段
    });
    const latency = Math.max(0, response.timings.phases?.total ?? (Date.now() - start));
    const statusCode = response.statusCode;
    return {
      status: statusCode >= 200 && statusCode < 400,
      detail: {
        delay: (latency >= 5000) ? 5000 : latency,
        code: statusCode,
        message: this.getErrorReason(statusCode),
        timings: response.timings.phases || {},
      },
    };
  } catch(error) {
    const latency = Math.abs(Date.now() - start);
    return {
      status: false,
      detail: {
        delay: 5000,
        code: error.code,
        message: this.getErrorReason(error.code),
        timings: {}
      },
    };
  }
}

