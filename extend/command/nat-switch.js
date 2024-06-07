const process = require('child_process');
const Helper = require('../helper');

/**
 * 创建NAT源地址转换
 */
exports.natSwitchSourceAdd = (s_con_name, s_address, d_con_name, d_address, convert_s_address) => {
  return new Promise((resolve, rejected) => {
    let query_res = `iptables -t nat -A POSTROUTING`;
    if(s_con_name && s_address) query_res += ` -i ${s_con_name} -s ${s_address}`
    if(d_con_name && d_address) query_res += ` -o ${d_con_name} -d ${d_address}`
    (convert_s_address) ? query_res += ` -j SNAT --to ${convert_s_address}` : `-j MASQUERADE`;
    console.log('query_res ===>', query_res);
    process.exec(query_res, (err, stdout, stderr) => {
      process.exec(`netfilter-persistent save`, (err, stdout, stderr) => resolve())
    })
  })
}
/**
 * 删除NAT源地址转换
 */
exports.natSwitchSourceDelete = (s_con_name, s_address, d_con_name, d_address, convert_s_address) => {
  return new Promise((resolve, rejected) => {
    let query_res = `iptables -t nat -D POSTROUTING`;
    if(s_con_name) query_res += ` -i ${s_con_name}`;
    if(s_address) query_res += ` -s ${s_address}`;
    if(d_con_name) query_res += ` -o ${d_con_name}`;
    if(d_address) query_res += ` -d ${d_address}`;
    (convert_s_address) ? query_res += ` -j SNAT --to ${convert_s_address}` : `-j MASQUERADE`;
    console.log('query_res ===>', query_res);
    process.exec(query_res, (err, stdout, stderr) => {
      process.exec(`netfilter-persistent save`, (err, stdout, stderr) => resolve())
    })
  })
}
/**
 * 创建NAT目标地址转换
 */
exports.natSwitchDestinAdd = (s_con_name, s_address, d_protocol, d_address, d_port, convert_d_address, convert_d_port) => {
  return new Promise((resolve, rejected) => {
    let query_res = `iptables -t nat -A PREROUTING`;
    if(d_protocol) query_res += ` -p ${d_protocol}`;
    if(s_con_name) query_res += ` -i ${s_con_name}`;
    if(s_address) query_res += ` -s ${s_address}`;
    if(d_address) query_res += ` -d ${d_address}`;
    if(d_port) query_res += ` -dport ${d_port}`;
    query_res += ` -j DNAT`;
    if(convert_d_address && convert_d_port) query_res += ` --to ${convert_d_address}:${convert_d_port}`;
    console.log('query_res ===>', query_res);
    process.exec(query_res, (err, stdout, stderr) => {
      process.exec(`netfilter-persistent save`, (err, stdout, stderr) => resolve())
    })
  })
}
/**
 * 删除NAT目标地址转换
 */
exports.natSwitchDestinDelete = (s_con_name, s_address, d_protocol, d_address, d_port, convert_d_address, convert_d_port) => {
  return new Promise((resolve, rejected) => {
    let query_res = `iptables -t nat -D PREROUTING`;
    if(d_protocol) query_res += ` -p ${d_protocol}`;
    if(s_con_name) query_res += ` -i ${s_con_name}`;
    if(s_address) query_res += ` -s ${s_address}`;
    if(d_address) query_res += ` -d ${d_address}`;
    if(d_port) query_res += ` -dport ${d_port}`;
    query_res += ` -j DNAT`;
    if(convert_d_address && convert_d_port) query_res += ` --to ${convert_d_address}:${convert_d_port}`;
    console.log('query_res ===>', query_res);
    process.exec(query_res, (err, stdout, stderr) => {
      process.exec(`netfilter-persistent save`, (err, stdout, stderr) => resolve())
    })
  })
}