const process = require('child_process');
const Helper = require('../helper');
const { resolve } = require('path');

/**
 * 自组网创建中心节点
 */
exports.manetCreateMaster = (manet_private_key, address_type, address, address_port, branch, con_name = "GE0") => {
  return new Promise((resolve, rejected) => {
    process.exec(`nmcli connection add type wireguard con-name ${con_name} ifname ${con_name} autoconnect no`, (err, stdout, stderr) => {
      process.exec(`nmcli connection modify ${con_name} ${address_type}.method manual ${address_type}.addresses ${address} ipv4.never-default yes`, (err, stdout, stderr) => {
        process.exec(`nmcli connection modify ${con_name} wireguard.private-key "${manet_private_key}"`, (err, stdout, stderr) => {
          process.exec(`nmcli connection modify ${con_name} wireguard.listen-port ${address_port}`, async(err, stdout, stderr) => {
            let tmp_string = '';
            branch.map(item => tmp_string += `[wireguard-peer.${item.manet_public_key}]\nallowed-ips=${item.address}\n`)
            await Helper.appendFiles('/etc/NetworkManager/system-connections/', `${con_name}.nmconnection`, `\n${tmp_string}`);
            process.exec(`nmcli connection load /etc/NetworkManager/system-connections/${con_name}.nmconnection`, (err, stdout, stderr) => {
              process.exec(`nmcli connection up ${con_name}`, (err, stdout, stderr) => resolve());
            })
          })
        })
      })
    })
  })
}
/**
 * 自组网更新中心节点
 */
exports.manetUpdateMaster = (branch, con_name = "GE0") => {
  return new Promise(async (resolve, rejected) => {
    let tmp_string = '';
    branch.map(item => tmp_string += `[wireguard-peer.${item.manet_public_key}]\nallowed-ips=${item.address}\n`)
    await Helper.writeFiles('/etc/NetworkManager/system-connections/', `${con_name}.nmconnection`, `\n${tmp_string}`);
    process.exec(`nmcli connection load /etc/NetworkManager/system-connections/${con_name}.nmconnection`, (err, stdout, stderr) => {
      process.exec(`nmcli connection up ${con_name}`, (err, stdout, stderr) => resolve());
    })
  })
}

/**
 * 自组网创建分支节点
 */
exports.manetCreateBranch = (private_key, address_type, address, master, con_name = "GE0") => {
  return new Promise((resolve, rejected) => {
    process.exec(`nmcli connection add type wireguard con-name ${con_name} ifname ${con_name} autoconnect no`, (err, stdout, stderr) => {
      process.exec(`nmcli connection modify ${con_name} ${address_type}.method manual ${address_type}.addresses ${address} ipv4.never-default yes`, (err, stdout, stderr) => {
        process.exec(`nmcli connection modify ${con_name} wireguard.private-key "${private_key}"`, async (err, stdout, stderr) => {
          let tmp_string = `[wireguard-peer.${master.manet_public_key}]\nendpoint=${master.address}:${master.address_port}\nallowed-ips=0.0.0.0/0\npersistent-keepalive=20\n`;
          await Helper.appendFiles('/etc/NetworkManager/system-connections/', `${con_name}.nmconnection`, `\n${tmp_string}`);
          process.exec(`nmcli connection load /etc/NetworkManager/system-connections/${con_name}.nmconnection`, (err,stdout, stderr) => {
            process.exec(`nmcli connection up ${con_name}`, (err, stdout, stderr) => resolve());
          })
        })
      })
    })
  })
}
/**
 * 自组网删除分支节点
 */
exports.manetDeleteBranch = (con_name = "GE0") => {
  return new Promise((resolve, rejected) => {
    process.exec(`nmcli connection delete ${con_name}`, (err, stdout, stderr) => resolve());
  })
}
