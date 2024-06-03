const process = require('child_process');
const Helper = require('../helper');

/**
 * 读取设备sn编码
 */
exports.readDeviceSerial = () => {
  return new Promise((resolve, rejected) => {
    process.exec(`dmidecode -t system |grep Serial|sed "s/^.Serial Number\: //g"`, (err, stdout, stderr) => {
      (stdout) ? stdout = Helper.stringTrimLine(stdout) : stdout;
      resolve(stdout);
    })
  })
}
/**
 * 验证是否能上网
 */
exports.verifyNetwork = () => {
  return new Promise( (resolve, rejected) => {
    process.exec(`ping -4 -q -c 3 www.baidu.com`, (err, stdout, stderr) => {
      const reg_res = stdout.match(/,(.*)(\S*)received/);
      const commandRes = (parseInt(stdout.match(/,(.*)(\S*)received/)[1]) == 0) ? 0 : 1;
      resolve(commandRes)
    })
  })
}
/**
 * cpu空闲率
 */
exports.cpuFree = () => {
  return new Promise( (resolve, rejected) => {
    process.exec(`mpstat | awk '$12 ~ /[0-9.]+/ {print $13}'`, (err, stdout, stderr) => {
      (stdout) ? stdout = Helper.stringTrimLine(stdout) : stdout;
      resolve(stdout);
    })
  })
}
/**
 * 内存空闲率
 */
exports.memoryFree = () => {
  return new Promise( (resolve, rejected) => {
    process.exec(`free -m | awk '/Mem:/ {print (100-($3/$2)*10)0}'`, (err, stdout, stderr) => {
      (stdout) ? stdout = Helper.stringTrimLine(stdout) : stdout;
      resolve(stdout);
    })
  })
}
/**
 * 磁盘空闲率
 */
exports.diskFree = () => {
  return new Promise( (resolve, rejected) => {
    process.exec("df -h | awk '/\\/$/ {print 100-$5}' | cut -d% -f1", (err, stdout, stderr) => {
      (stdout) ? stdout = Helper.stringTrimLine(stdout) : stdout;
      resolve(stdout);
    })
  })
}
/**
 * 获取物理网卡数量
 */
exports.vmnicCount = () => {
  return new Promise((resolve, rejected) => {
    process.exec("lspci | grep -i ethernet | wc -l", (err,stdout, stderr) => {
      (stdout) ? stdout = Helper.stringTrimLine(stdout) : stdout;
      resolve(stdout);
    })
  })
}
/**
 * 获取网络IP地址
 */
exports.networkAddress = (con_name = "GE0") => {
  return new Promise((resolve, rejected) => {
    process.exec(`nmcli -f IP4.ADDRESS --mode tabular --terse con show ${con_name}`, (err, stdout, stderr) => {
      (stdout) ? stdout = Helper.stringTrimLine(stdout) : stdout;
      resolve(stdout)
    })
  })
}
/** 
 * 获取网络网关 
 */
exports.networkGateway = (con_name = "GE0") => {
  return new Promise((resolve, rejected) => {
    process.exec(`nmcli -f IP4.GATEWAY --mode tabular --terse con show ${con_name}`, (err, stdout, stderr) => {
      (stdout) ? stdout = Helper.stringTrimLine(stdout) : stdout;
      resolve(stdout)
    })
  })
}
/**
 * 获取网络DNS
 */
exports.networkDns = (con_name = "GE0") => {
  return new Promise((resolve, rejected) => {
    process.exec(`nmcli -f IP4.DNS --mode tabular --terse con show ${con_name}`, (err, stdout, stderr) => {
      (stdout) ? stdout = Helper.stringTrimLine(stdout) : stdout;
      resolve(stdout);
    })
  })
}
/**
 * 获取ADSL账号
 */
exports.pppoeAccount = (con_name = "GE0") => {
  return new Promise((resolve, rejected) => {
    process.exec(`nmcli -f pppoe.username --mode tabular --terse con show ${con_name}`, (err, stdout, stderr) => {
      (stdout) ? stdout = Helper.stringTrimLine(stdout) : stdout;
      resolve(stdout);
    })
  })
}
