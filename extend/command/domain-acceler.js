const process = require('child_process');
const Helper = require('../helper');

/**
 * 添加域名加速服务
 */
exports.domainAccelerAdd = (domain_list, con_name = "GE0") => {
  return new Promise(async (resolve, rejected) => {
    let content = "";
    domain_list.map(item => content += `ipset=/${item}/vpn4\n`)
    await Helper.writeFiles('/etc/dnsmasq.d/', 'outside.conf', content);
    process.exec(`ipset create vpn4 hash:ip`, (err, stdout, stderr) => {
      process.exec(`ip rule add fwmark 100 table 100`, (err, stdout, stderr) => {
        process.exec(`ipset save > /etc/ipset/ipset-rules.save`, (err, stdout, stderr) => {
          process.exec(`iptables -t mangle -I PREROUTING -i LAN -m set --match-set vpn4 dst -j MARK --set-mark 100`, (err, stdout, stderr) => {
            process.exec(`netfilter-persistent save`, (err, stdout, stderr) => {
              process.exec(`systemctl restart dnsmasq.service`, (err, stdout, stderr) => resolve())
            })
          })
        })
      })
    })
  })
}
/**
 * 更新域名加速服务
 */
exports.domainAccelerUpdate = (domain_list, con_name = "GE0") => {
  return new Promise(async (resolve, rejected) => {
    let content = "";
    domain_list.map(item => content += `ipset=/${item}/vpn4\n`)
    await Helper.writeFiles('/etc/dnsmasq.d/', 'outside.conf', content);
    process.exec(`systemctl restart dnsmasq.service`, (err, stdout, stderr) => resolve())
  })
}
/**
 * 删除域名加速服务
 */
exports.domainAccelerDelete = () => {
  return new Promise(async (resolve, rejected) => {
    await Helper.deleteFiles(`/etc/dnsmasq.d/`, 'outside.conf');
    process.exec(`iptables -t mangle -D PREROUTING -i LAN -m set --match-set vpn4 dst -j MARK --set-mark 100`, (err, stdout, stderr) => {
      process.exec(`ipset destroy vpn4`, (err, stdout, stderr) => {
        process.exec(`ip rule del fwmark 100 table 100`, (err, stdout, stderr) => {
          process.exec(`ipset save > /etc/ipset/ipset-rules.save`, (err, stdout, stderr) => {
            process.exec(`netfilter-persistent save`, (err, stdout, stderr) => {
              process.exec(`systemctl restart dnsmasq.service`, (err, stdout, stderr) => resolve())
            })
          })
        })
      })
    })
  })
}
/**
 * 添加域名加速指定DNS解析服务
 */
exports.domainAccelerDnsAdd = (dns_analy_before, dns_analy_after, domain_list, con_name = "GE0") => {
  return new Promise(async(resolve, rejected) => {
    let content = "";
    domain_list.map(item => content += `server=/${item}/${dns_analy}`)
    await Helper.writeFiles('/etc/dnsmasq.d/', 'domain.conf', content)
    process.exec(`nmcli connection modify ${con_name} -ipv4.routes "${dns_analy_before}/32"`, (err, stdout, stderr) => {
      process.exec(`nmcli connection modify ${con_name} +ipv4.routes "${dns_analy_after}/32"`, (err, stdout, stderr) => {
        process.exec(`nmcli connection up ${con_name}`, (err, stdout, stderr) => {
          process.exec(`systemctl restart dnsmasq.service`, (err, stdout, stderr) => resolve())
        })
      })
    })
  })
}
/**
 * 删除域名加速指定DNS解析服务
 */
exports.domainAccelerDnsDelete = (dns_analy, con_name = "GE0") => {
  return new Promise(async (resolve, rejected) => {
    process.exec(`nmcli connection modify ${con_name} -ipv4.routes "${dns_analy}/32"`, (err, stdout, stderr) => {
      process.exec(`nmcli connection up ${con_name}`, (err, stdout, stderr) => {
        process.exec(`systemctl restart dnsmasq.service`, (err, stdout, stderr) => resolve())
      })
    })
  })
}