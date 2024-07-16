const process = require('child_process');
const Helper = require('../helper');

exports.firewallAdd = (s_interface_name, d_interface_name, s_ip_address, d_ip_address, firewall_protocol, firewall_action) => {
  return new Promise(async (resolve, rejected) => {
    let content = `*filter\n`
    for(let i = 0 ; i < s_ip_address.length; i++) {
      for(let k = 0; k < d_ip_address.length; k++) {
        content += `-A FORWARD -i ${s_interface_name} -o ${d_interface_name} -s ${s_ip_address[i]} -d ${d_ip_address[k]}`;
        if(firewall_protocol != 'all') content += ` -p ${firewall_protocol}`;
        content += ` --${firewall_action}\n`
      }
    }
    content += `COMMIT`;
    console.log('content===>>', content);
    await Helper.writeFiles('/etc', "firewall.rule", content);
    process.exec(`iptables-restore -t filter < /etc/firewall.rule`, (err, stdout, stderr) => {
      process.exec(`netfilter-persistent save`, (err, stdout, stderr) => resolve());
    })
  })
}