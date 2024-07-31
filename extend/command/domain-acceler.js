const process = require('child_process');
const Helper = require('../helper');

/**
 * 添加域名加速服务
 * 
 * const send_body: any = {sn: device_info.device_serial, payload: {
 *  pop: pop_id_array, dns_analy_before: '8.8.8.8', dns_analy_after: domain_acceler_dns_analy, domain_list: white_list[0].domain
 * }};
 */
exports.domainAccelerAdd = (data) => {
  return new Promise(async (resolve, rejected) => {
    await Helper.writeFiles(CONFIG.SCHEDULE_DOMAIN_ACCELER_PATH, "vpn.js", JSON.stringify(data));
    let outside_content = "", domain_content = "";
    data.domain_list.map(item => outside_content += `ipset=/${item}/vpn4\n`)
    await Helper.writeFiles('/etc/dnsmasq.d/', 'outside.conf', outside_content);
    data.domain_list.map(item => domain_content += `server=/${item}/8.8.8.8`);
    await Helper.writeFiles('/etc/dnsmasq.d/', 'domain.conf', domain_content);
    process.exec(`ipset create vpn4 hash:ip`, (err, stdout, stderr) => {
      process.exec(`ip rule add fwmark 100 table 100`, (err, stdout, stderr) => {
        process.exec(`ip rule save > /etc/ip-rules.bin`, (err, stdout, stderr) => {
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
  })
}

/**
 * 删除域名加速服务
 */
exports.domainAccelerDelete = () => {
  return new Promise(async (resolve, rejected) => {
    await Helper.deleteFiles(CONFIG.SCHEDULE_DOMAIN_ACCELER_PATH, "vpn.js")
    await Helper.deleteFiles(`/etc/dnsmasq.d/`, 'outside.conf');
    await Helper.deleteFiles('/etc/dnsmasq.d/', 'domain.conf');
    process.exec(`iptables -t mangle -D PREROUTING -i LAN -m set --match-set vpn4 dst -j MARK --set-mark 100`, (err, stdout, stderr) => {
      process.exec(`ipset destroy vpn4`, (err, stdout, stderr) => {
        process.exec(`ip rule del fwmark 100 table 100`, (err, stdout, stderr) => {
          process.exec(`ip rule save > /etc/ip-rules.bin`, (err, stdout,stderr) => {
            process.exec(`ipset save > /etc/ipset/ipset-rules.save`, (err, stdout, stderr) => {
              process.exec(`netfilter-persistent save`, (err, stdout, stderr) => {
                process.exec(`nmcli connection modify PPTP0 -ipv4.routes "8.8.8.8/32"`, (err, stdout, stderr) => {
                  process.exec(`nmcli connection up PPTP0`, (err, stdout, stderr) => {
                    process.exec(`systemctl restart dnsmasq.service`, (err, stdout, stderr) => resolve())
                  })
                })
              })
            })
          })
        })
      })
    })
  })
}

/**
 * process.exec(`nmcli connection modify ${con_name} +ipv4.routes "${data.dns_analy_after}/32"`, (err, stdout, stderr) => {
                    process.exec(`nmcli connection up ${con_name}`, (err, stdout, stderr) => {
 */

exports.vpnConnection = (gateway) => {
  return new Promise(async (resolve, rejected) => {
    const is_exists = await Helper.existsFiles('/etc/NetworkManager/system-connections', 'PPTP0.nmconnection')
    if(is_exists) {
      process.exec(`nmcli con del PPTP0`, (err, stdout, stderr) => {
        process.exec(`nmcli connection add type vpn con-name PPTP0 ifname PPTP0 vpn-type pptp ipv4.never-default yes ipv4.ignore-auto-routes yes vpn.secrets "password=erli" vpn.data "user-name=erli" +vpn.data  "gateway=${gateway}"  autoconnection=no`, (err, stdout, stderr) => {
          process.exec(`nmcli connection modify PPTP0 +ipv4.routes "8.8.8.8/32"`, (err, stdout, stderr) => resolve())
        })
      })
    } else {
      process.exec(`nmcli connection add type vpn con-name PPTP0 ifname PPTP0 vpn-type pptp ipv4.never-default yes ipv4.ignore-auto-routes yes vpn.secrets "password=erli" vpn.data "user-name=erli" +vpn.data  "gateway=${gateway}"  autoconnection=no`, (err, stdout, stderr) => {
        process.exec(`nmcli connection modify PPTP0 +ipv4.routes "8.8.8.8/32"`, (err, stdout, stderr) => resolve())
      })
    }
  })
}

// exports.domainAccelerAdd = (domain_list, con_name = "GE0") => {
//   // return new Promise(async (resolve, rejected) => {
//   //   let content = "";
//   //   domain_list.map(item => content += `ipset=/${item}/vpn4\n`)
//   //   await Helper.writeFiles('/etc/dnsmasq.d/', 'outside.conf', content);
//   //   process.exec(`ipset create vpn4 hash:ip`, (err, stdout, stderr) => {
//   //     process.exec(`ip rule add fwmark 100 table 100`, (err, stdout, stderr) => {
//   //       process.exec(`ip rule save > /etc/ip-rules.bin`, (err, stdout, stderr) => {
//   //         process.exec(`ipset save > /etc/ipset/ipset-rules.save`, (err, stdout, stderr) => {
//   //           process.exec(`iptables -t mangle -I PREROUTING -i LAN -m set --match-set vpn4 dst -j MARK --set-mark 100`, (err, stdout, stderr) => {
//   //             process.exec(`netfilter-persistent save`, (err, stdout, stderr) => {


//   //               process.exec(`systemctl restart dnsmasq.service`, (err, stdout, stderr) => resolve())
//   //             })
//   //           })
//   //         })
//   //       })
//   //     })
//   //   })
//   // })
//   // return new Promise(async (resolve, rejected) => {
//   //   let content = "";
//   //   domain_list.map(item => content += `ipset=/${item}/vpn4\n`)
//   //   await Helper.writeFiles('/etc/dnsmasq.d/', 'outside.conf', content);
//   //   process.exec(`ipset create vpn4 hash:ip`, (err, stdout, stderr) => {
//   //     process.exec(`ip rule add fwmark 100 table 100`, (err, stdout, stderr) => {
//   //       process.exec(`ip rule save > /etc/ip-rules.bin`, (err, stdout, stderr) => {
//   //         process.exec(`ipset save > /etc/ipset/ipset-rules.save`, (err, stdout, stderr) => {
//   //           process.exec(`iptables -t mangle -I PREROUTING -i LAN -m set --match-set vpn4 dst -j MARK --set-mark 100`, (err, stdout, stderr) => {
//   //             process.exec(`netfilter-persistent save`, (err, stdout, stderr) => {
//   //               process.exec(`systemctl restart dnsmasq.service`, (err, stdout, stderr) => resolve())
//   //             })
//   //           })
//   //         })
//   //       })
//   //     })
//   //   })
//   // })
// }
// /**
//  * 更新域名加速服务
//  */
// exports.domainAccelerUpdate = (domain_list, con_name = "GE0") => {
//   return new Promise(async (resolve, rejected) => {
//     let content = "";
//     domain_list.map(item => content += `ipset=/${item}/vpn4\n`)
//     await Helper.writeFiles('/etc/dnsmasq.d/', 'outside.conf', content);
//     process.exec(`systemctl restart dnsmasq.service`, (err, stdout, stderr) => resolve())
//   })
// }
// /**
//  * 删除域名加速服务
//  */
// exports.domainAccelerDelete = () => {
//   return new Promise(async (resolve, rejected) => {
//     await Helper.deleteFiles(`/etc/dnsmasq.d/`, 'outside.conf');
//     process.exec(`iptables -t mangle -D PREROUTING -i LAN -m set --match-set vpn4 dst -j MARK --set-mark 100`, (err, stdout, stderr) => {
//       process.exec(`ipset destroy vpn4`, (err, stdout, stderr) => {
//         process.exec(`ip rule del fwmark 100 table 100`, (err, stdout, stderr) => {
//           process.exec(`ip rule save > /etc/ip-rules.bin`, (err, stdout,stderr) => {
//             process.exec(`ipset save > /etc/ipset/ipset-rules.save`, (err, stdout, stderr) => {
//               process.exec(`netfilter-persistent save`, (err, stdout, stderr) => {
//                 process.exec(`systemctl restart dnsmasq.service`, (err, stdout, stderr) => resolve())
//               })
//             })
//           })
//         })
//       })
//     })
//   })
// }
// /**
//  * 添加域名加速指定DNS解析服务
//  */
// exports.domainAccelerDnsAdd = (dns_analy_before, dns_analy_after, domain_list, con_name = "GE0") => {
//   return new Promise(async(resolve, rejected) => {
//     let content = "";
//     domain_list.map(item => content += `server=/${item}/${dns_analy}`)
//     await Helper.writeFiles('/etc/dnsmasq.d/', 'domain.conf', content)
//     process.exec(`nmcli connection modify ${con_name} -ipv4.routes "${dns_analy_before}/32"`, (err, stdout, stderr) => {
//       process.exec(`nmcli connection modify ${con_name} +ipv4.routes "${dns_analy_after}/32"`, (err, stdout, stderr) => {
//         process.exec(`nmcli connection up ${con_name}`, (err, stdout, stderr) => {
//           process.exec(`systemctl restart dnsmasq.service`, (err, stdout, stderr) => resolve())
//         })
//       })
//     })
//   })
// }
// /**
//  * 删除域名加速指定DNS解析服务
//  */
// exports.domainAccelerDnsDelete = (dns_analy, con_name = "GE0") => {
//   return new Promise(async (resolve, rejected) => {
//     process.exec(`nmcli connection modify ${con_name} -ipv4.routes "${dns_analy}/32"`, (err, stdout, stderr) => {
//       process.exec(`nmcli connection up ${con_name}`, (err, stdout, stderr) => {
//         process.exec(`systemctl restart dnsmasq.service`, (err, stdout, stderr) => resolve())
//       })
//     })
//   })
// }