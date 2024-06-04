const process = require('child_process');
const Helper = require('../helper');

exports.diagnoseAddPing = (host, address_type, interface_name, frequency = 5, interval = 1) => {
  return new Promise((resolve, rejected) => {
    let query_res = `ping ${host} -c ${frequency} -i ${interval}`;
    (address_type == 1) ? query_res += ` -4` : query_res += ` -6`;
    if(interface_name) query_res += ` -I ${interface_name}`;
    console.log('query_res===>>', query_res);
    process.exec(query_res, (err, stdout, stderr) => {
      resolve(stdout) || resolve(err || stderr)
    })
  })
}

exports.diagnoseAddTraceRouter = (host, address_type, interface_name, hop_count = 18, is_as = false, is_icmp = false) => {
  return new Promise((resolve, rejected) => {
    let query_res = `traceroute ${host} -m ${hop_count}`;
    (address_type == 1) ? query_res += ` -4` : query_res += ` -6`;
    if(interface_name) query_res += ` -i ${interface_name}`;
    if(is_as) query_res += ` -A`
    if(is_icmp) query_res += ` -P icmp`;
    console.log('query_res=====>>', query_res);
    process.exec(query_res, (err, stdout, stderr) => {
      resolve(stdout) || resolve(err || stderr)
    })
  })
}