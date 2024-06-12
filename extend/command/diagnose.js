const process = require('child_process');
const Helper = require('../helper');

exports.diagnoseAddPing = (host, address_type, interface_name, frequency = 5, interval = 1) => {
  return new Promise((resolve, rejected) => {
    let query_res = `ping ${host} -c ${frequency} -i ${interval}`;
    (address_type == 1) ? query_res += ` -4` : query_res += ` -6`;
    if(interface_name) query_res += ` -I ${interface_name}`;
    console.log('query_res===>>', query_res);
    process.exec(query_res, (err, stdout, stderr) => {
      (stdout) ? resolve(stdout) : resolve(stderr || err);
    })
  })
}

exports.diagnoseAddTraceRouter = (host, address_type, interface_name, hop_count = 18, is_as = false, is_icmp = false) => {
  return new Promise((resolve, rejected) => {
    let query_res = `traceroute -n ${host} -m ${hop_count}`;
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

exports.diagnoseAddDomain = (host, dns) => {
  return new Promise((resolve, rejected) => {
    let query_res = `nslookup ${host}`
    if(dns) query_res += ` ${dns}`;
    console.log('query_res=====>>', query_res);
    process.exec(query_res, (err, stdout, stderr) => {
      resolve(stdout) || resolve(err || stderr)
    })
  })
}

exports.diagnoseAddInterface = (host, interface_name, port) => {
  return new Promise((resolve, rejected) => {
    let query_res = `hping3 -c 5 -S ${host}`;
    if(interface_name) query_res += ` -I ${interface_name}`;
    if(port) query_res += ` -p ${port}`
    console.log('query_res=====>>', query_res);
    process.exec(query_res, (err, stdout, stderr) => {
      resolve(stdout) || resolve(err || stderr)
    })
  })
}

exports.diagnoseAddCapturePackage = (host, host_type, interface_name, protocol, port, package_path, msg_count = 500, timeout = 60) => {
  return new Promise((resolve, rejected) => {
    let query_res = `timeout ${timeout} tcpdump -c ${msg_count} -w ${package_path}`
    if(interface_name) query_res += ` -i ${interface_name}`;
    let host_params, protocol_params, port_params, params_arr = [];
    if(host && host.length != 0) {
      host_params = `host ${(host_type == 1) ? host.join(' or ') : host.join(' and ')}`;
      params_arr.push(host_params);
    }
    if(protocol) {
      protocol_params = `${protocol}`;
      params_arr.push(protocol_params);
    }
    if(port && port.length != 0) {
      port_params = `port ${port.join(' or ')}`;
      params_arr.push(port_params);
    }
    if(params_arr.length != 0) {
      let tmp_str = params_arr.join(' and ');
      query_res += ` ${tmp_str}`
    }
    console.log('quer_res===>>', query_res);
    process.exec(query_res, (err, stdout, stderr) => resolve())
  })
}