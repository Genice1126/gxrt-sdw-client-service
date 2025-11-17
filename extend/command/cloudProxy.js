const process = require('child_process');
const Helper = require('../helper');
const CONFIG = require('../../config');

exports.enableCloudProxy = (cloud_host, device_cloud_proxy_adr) => {
  let tmpArray = cloud_host.split(",")
  let last = tmpArray.pop();
  let last_info = last.split(":")
  return new Promise((resolve, rejected) => {
    process.exec(`autossh -M 20000 -o "ProxyJump=${last.join(",")}" -D 1080 -p ${last_info[1]} ${last_info[0]} -N`, (err, stdout, stderr) => {
      process.exec(`systemctl start redsocks`, (err, stdout, stderr) => {
        process.exec(`
          sudo iptables -t nat -N REDSOCKS;
          sudo iptables -t nat -A REDSOCKS -d 0.0.0.0/8 -j RETURN;
          sudo iptables -t nat -A REDSOCKS -d 10.0.0.0/8 -j RETURN;
          sudo iptables -t nat -A REDSOCKS -d 127.0.0.0/8 -j RETURN;
          sudo iptables -t nat -A REDSOCKS -d 169.254.0.0/16 -j RETURN;
          sudo iptables -t nat -A REDSOCKS -d 172.16.0.0/12 -j RETURN;
          sudo iptables -t nat -A REDSOCKS -d 192.168.0.0/16 -j RETURN;
          sudo iptables -t nat -A REDSOCKS -d 224.0.0.0/4 -j RETURN;
          sudo iptables -t nat -A REDSOCKS -d 240.0.0.0/4 -j RETURN;  
        `, (err, stdout, stderr) => {
          process.exec(`iptables -t nat -A REDSOCKS -p tcp -j REDIRECT --to-ports 12345`, (err, stdout, stderr) => {
            if(device_cloud_proxy_adr) {
              process.exec(`iptables -t nat -A PREROUTING -s ${device_cloud_proxy_adr} -p tcp -j REDSOCKS`, (err, stdout, stderr) => resolve())
            }else {
              resolve()
            }
          })
        })
      })
    })
  })
}

exports.disableCloudProxy = () => {
  return new Promise((resolve, rejected) => {
    process.exec(`
      iptables -t nat -F REDSOCKS;
      iptables -t nat -X REDSOCKS;
      systemctl stop redsocks;
      pkill -f "autossh -M 20000";
    `, (err, stdout, stderr) => resolve())
  })
}