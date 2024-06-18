const process = require('child_process');
const Helper = require('../helper');

/**
 * 获取所有虚拟接口名称
 */
exports.interfaceVirtualName = () => {
  return new Promise((resolve, rejected) => {
    process.exec(`ls /sys/class/net | grep -E 'wg'`, (err, stdout, stderr) => {
      (stdout) ? stdout = stdout.split("\n").filter(item => item !== '') : [];
      resolve(stdout);
    })
  })
}
/**
 * 获取接口发送流量
 */
exports.interfaceRxFlowCollect = (con_name = "GE0") => {
  return new Promise((resolve, rejected) => {
    process.exec(`cat /sys/class/net/${con_name}/statistics/tx_bytes`, (err, stdout, stderr) => {
      (stdout) ? stdout = Helper.stringTrimLine(stdout) : stdout;
      resolve(stdout);
    })
  })
}
/**
 * 获取接口发送包个数
 */
exports.interfaceRxPacketCollect = (con_name = "GE0") => {
  return new Promise((resolve, rejected) => {
    process.exec(`cat /sys/class/net/${con_name}/statistics/tx_packets`, (err, stdout, stderr) => {
      (stdout) ? stdout = Helper.stringTrimLine(stdout) : stdout;
      resolve(stdout);
    })
  })
}
/**
 * 获取接口接收流量
 */
exports.interfaceTxFlowCollect = (con_name = "GE0") => {
  return new Promise((resolve, rejected) => {
    process.exec(`cat /sys/class/net/${con_name}/statistics/rx_bytes`, (err, stdout, stderr) => {
      (stdout) ? stdout = Helper.stringTrimLine(stdout) : stdout;
      resolve(stdout);
    })
  })
}
/**
 * 获取接口接收包个数
 */
exports.interfaceTxPacketCollect = (con_name = "GE0") => {
  return new Promise((resolve, rejected) => {
    process.exec(`cat /sys/class/net/${con_name}/statistics/rx_packets`, (err, stdout, stderr) => {
      (stdout) ? stdout = Helper.stringTrimLine(stdout) : stdout;
      resolve(stdout);
    })
  })
}
/**
 * 获取网络端口类型(wan lan)
 */
exports.interfaceType = (con_name = "GE0") => {
  return new Promise((resolve, rejected) => {
    process.exec(`nmcli -f connection.stable-id --mode tabular --terse con show ${con_name}`, (err, stdout, stderr) => {
      (stdout) ? stdout = Helper.stringTrimLine(stdout) : stdout;
      resolve(stdout);
    })
  })
}
/**
 * 获取网络方法(manual...)
 */
exports.interfaceMethod = (con_name = "GE0") => {
  return new Promise((resolve, rejected) => {
    process.exec(`nmcli -f ipv4.method --mode tabular --terse con show ${con_name}`, (err, stdout, stderr) => {
      (stdout) ? stdout = Helper.stringTrimLine(stdout) : stdout;
      resolve(stdout);
    })
  })
}
/**
 * 获取网络状态
 */
exports.interfaceStatus = (con_name = "GE0") => {
  return new Promise((resolve, rejected) => {
    process.exec(`nmcli -f GENERAL.STATE --mode tabular --terse con show ${con_name}`, (err, stdout, stderr) => {
      (stdout) ? stdout = Helper.stringTrimLine(stdout) : stdout;
      (stdout == 'activated') ? resolve(true) : resolve(false)
    })
  })
}
/**
 * 更新WAN-Group信息
 */
exports.interfaceUpdateWanGroup = (deploy_detail, con_name = "GE0") => {
  return new Promise((resolve, rejected) => {
    process.exec(`nmcli con del ${con_name}`, (err, stdout, stderr) => {
      let query_res;
      if(Object.keys(deploy_detail).length == 0) {
        query_res = `nmcli con add type ethernet ifname ${con_name} con-name ${con_name} connection.stable-id WAN ipv4.method auto`;
      } else if(deploy_detail && deploy_detail.hasOwnProperty('username')) {
        query_res = `nmcli con add type pppoe ifname ${con_name} con-name ${con_name} connection.stable-id WAN pppoe.username ${deploy_detail.username} pppoe.password ${deploy_detail.password} ipv4.method auto`;
      } else {
        query_res = `nmcli con add type ethernet ifname ${con_name} con-name ${con_name} connection.stable-id WAN ipv4.addresses ${deploy_detail.address} `;
        if(deploy_detail.gateway) query_res += `ipv4.gateway ${deploy_detail.gateway} `;
        if(deploy_detail.gateway_weight != "0") query_res += `metric ${deploy_detail.gateway_weight} `
        if(deploy_detail.dns) query_res += `ipv4.dns ${deploy_detail.dns} `;
        query_res += `ipv4.method manual`
      }
      process.exec(query_res, (err, stdout, stderr) => {
        process.exec(`nmcli connection up ${con_name}`, (err, stdout, stderr) => resolve())
      })
    })
  })
}
/**
 * 更新LAN-Group口信息
 */
exports.interfaceUpdateLanGroup = (deploy_detail, con_name = "GE0") => {
  return new Promise((resolve, rejected) => {
    process.exec(`nmcli con del ${con_name}`, (err,stdout, stderr) => {
      let query_res;
      if(deploy_detail && Object.keys(deploy_detail).length !== 0 && deploy_detail.hasOwnProperty('address')) {
        query_res = `nmcli con add type bridge-slave ifname ${con_name} master LAN con-name ${con_name} connection.stable-id LAN ipv4.addresses ${deploy_detail.address} `
        if(deploy_detail.gateway) query_res += `ipv4.gateway ${deploy_detail.gateway} `;
        if(deploy_detail.dns) query_res += `ipv4.dns ${deploy_detail.dns} `;
        query_res += `ipv4.method manual`
      } else {
        query_res = `nmcli con add type bridge-slave ifname ${con_name} master LAN con-name ${con_name} connection.stable-id LAN`
      }
      process.exec(query_res, (err, stdout, stderr) => {
        process.exec(`nmcli connection up ${con_name}`, (err, stdout, stderr) => resolve())
      })
    })
  })
}
/**
 * 更新LAN口ip地址
 */
exports.interfaceUpdateLanAddress = (params) => {
  return new Promise((resolve, rejected) => {
    process.exec(`nmcli connection modify LAN ipv4.method manual ipv4.addresses ${params.deploy_detail.address}`, (err, stdout, stderr) => {
      process.exec(`nmcli connection up LAN`, (err, stdout, stderr) => resolve())
    })
  })
}
/**
 * 开启LAN口Dhcp
 */
exports.interfaceAddLanDhcp = (start, end, gateway, dns, tenancy) => {
  return new Promise(async (resolve, rejected) => {
    await Helper.deleteFiles('/etc/dnsmasq.d', 'dhcp.conf');
    const content = `interface=LAN\ndhcp-range=${start},${end},255.255.255.0,${tenancy}h\ndhcp-option=3,${gateway}dhcp-option=6,${dns}`
    await Helper.writeFiles('/etc/dnsmasq.d', 'dhcp.conf', content);
    process.exec(`systemctl restart dnsmasq`, (err, stdout, stderr) => resolve());
  })
}
/**
 * 关闭LAN口Dhcp
 */
exports.interfaceDeleteLanDhcp = () => {
  return new Promise(async (resolve, rejected) => {
    await Helper.deleteFiles('/etc/dnsmasq.d/', 'dhcp.conf');
    process.exec(`systemctl restart dnsmasq`, (err, stdout, stderr) => resolve())
  })
}
/**
 * 开启LAN口Dns
 */
exports.interfaceAddLanDns = (address, port, cache_size, upstream, analysis) => {
  return new Promise(async (resolve, rejected) => {
    let server_content = '', address_content = '';
    upstream.map(item => server_content += `server=${item}\n`)
    analysis.map(item => address_content += `address=/${item.domain}/${item.ip}\n`);
    const content = `cache-size=${cache_size}\n${server_content}${address_content}`
    await Helper.writeFiles('/etc/dnsmasq.d/', 'dns.conf', content)
    process.exec(`systemctl restart dnsmasq`, (err, stdout, stderr) => resolve())
  })
}
/**
 * 强制开启Lan口本地Dns
 */
exports.interfaceAddLanLocalDns = () => {
  return new Promise(async (resolve, rejected) => {
    process.exec(`iptables -t nat -A PREROUTING  -i LAN  --dport 53 -j DNAT --to 127.0.0.1:53`, (err, stdout, stderr) => {
      process.exec(`netfilter-persistent save`, (err, stdout, stderr) => resolve())
    })
  })
}
/**
 * 删除LAN口Dns
 */
exports.interfaceDeleteLanDns = () => {
  return new Promise(async (resolve, rejected) => {
    await Helper.deleteFiles('/etc/dnsmasq.d/', 'dns.conf');
    process.exec(`systemctl restart dnsmasq`, (err, stdout, stderr) => resolve())
  })
}
/**
 * 删除Lan口本地Dns
 */
exports.interfaceDeleteLanLocalDns = () => {
  return new Promise(async (resolve, rejected) => {
    process.exec(`iptables -t nat -D PREROUTING -i LAN --dport 53 -j DNAT --to 127.0.0.1:53`, (err, stdout, stderr) => {
      process.exec(`netfilter-persistent save`, (err, stdout, stderr) => resolve())
    })
  })
}
/**
 * 创建静态路由
 */
exports.interfaceAddStaticRouter = (target, next, con_name = "GE0") => {
  return new Promise((resolve, rejected) => {
    process.exec(`nmcli connection modify ${con_name} +ipv4.routes "${target} ${next}"`, (err, stdout, stderr) => {
      process.exec(`nmcli connection up ${con_name}`, (err, stdout, stderr) => resolve())
    });
  })
}
/**
 * 删除静态路由
 */
exports.interfaceDeleteStaticRouter = (target, next, con_name = "GE0") => {
  return new Promise((resolve, rejected) => {
    process.exec(`nmcli connection modify ${con_name} -ipv4.routes "${target} ${next}"`, (err, stdout, stderr) => {
      process.exec(`nmcli connection up ${con_name}`, (err, stdout, stderr) => resolve())
    });
  })
}