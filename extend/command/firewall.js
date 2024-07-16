const process = require('child_process');
const Helper = require('../helper');

exports.firewallAdd = (data) => {
  return new Promise(async (resolve, rejected) => {
    let content = `*filter\n`
    for(let m = 0; m < data.length; m++) {
      for(let i = 0 ; i < data[m].s_ip_address.length; i++) {
        for(let k = 0; k < data[m].d_ip_address.length; k++) {
          content += `-A FORWARD -i ${data[m].s_interface_name} -o ${data[m].d_interface_name} -s ${data[m].s_ip_address[i]} -d ${data[m].d_ip_address[k]}`;
          if(data[m].firewall_protocol != 'all') content += ` -p ${data[m].firewall_protocol}`;
          content += ` -j ${data[m].firewall_action}\n`
        }
      }
    }
    content += `COMMIT`;
    console.log('content===>>', content);
    await Helper.writeFiles('/etc', "firewall.rule", content);
    process.exec(`iptables-restore -T filter < /etc/firewall.rule`, (err, stdout, stderr) => {
      process.exec(`netfilter-persistent save`, (err, stdout, stderr) => resolve());
    })
  })
}