const process = require('child_process');
const Helper = require('../helper');
const CONFIG = require('../../config');
const path = require('path');

exports.routerStrategyIpAdd = (name, file_data) => {
  return new Promise(async (resolve, rejected) => {
    await Helper.writeFiles(CONFIG.ROUTER_STRATEGY_IP_PATH, `${name}.txt`, JSON.stringify(file_data));
    process.exec(`ipset create ${name} hash:net hashsize 8192 maxelem 100000`, (err, stdout, stderr) => {
      process.exec(`sed 's/^/add myipset /' ${path.join(CONFIG.ROUTER_STRATEGY_IP_PATH, `${name}.txt`)} >> ipset.restore`, (err, stdout, stderr) => {
        process.exec(`ipset restore -f ipset.restore`, (err, stdout, stderr) => resolve())
      })
    })
  })
}

exports.routerStrategyIpDelete = (name) => {
  return new Promise(async (resolve, rejected) => {
    process.exec(`ipset destroy ${name}`, (err, stdout, stderr) => resolve());
  })
}

exports.routerStrategyAdd = (body) => {
  return new Promise(async (resolve, rejected) => {
    if(body.source_addr_type == 1) {
      process.exec(`echo "${body.strategy_number} ${body.strategy_number}" | tee -a /etc/iproute2/rt_tables`, (err, stdout, stderr) => {
        process.exec(`iptables -t mangle -A PREROUTING -s ${body.source_addr_ip} -j MARK --set-mark ${body.strategy_number}`, (err, stdout, stderr) => {
          process.exec(`iptables-save > /etc/iptables/rules.v4`, (err, stdout, stderr) => {
            process.exec(`ip rule add fwmark ${body.strategy_number} table ${body.strategy_number}`, (err, stdout, stderr) => {
              process.exec(`ip route add default via ${body.next_nat_router} dev ${body.nat_router} table ${body.strategy_number}`, (err, stdout, stderr) => resolve())
            })
          })
        })
      })
    }
    if(body.source_addr_type == 2) {
      process.exec(`echo "${body.strategy_number} ${body.strategy_number}" | tee -a /etc/iproute2/rt_tables`, (err, stdout, stderr) => {
        process.exec(`iptables -t mangle -A PREROUTING -m set --match-set ${body.source_addr_ip} dst -j MARK --set-mark ${body.strategy_number}`, (err, stdout, stderr) => {
          process.exec(`iptables-save > /etc/iptables/rules.v4`, (err, stdout, stderr) => {
            process.exec(`ip rule add fwmark ${body.strategy_number} table ${body.strategy_number}`, (err, stdout, stderr) => {
              process.exec(`ip route add default via ${body.next_nat_router} dev ${body.nat_router} table ${body.strategy_number}`, (err, stdout, stderr) => resolve())
            })
          })
        })
      })
    }
    if(body.source_addr_type == 3) {
      process.exec(`echo "${body.strategy_number} ${body.strategy_number}" | tee -a /etc/iproute2/rt_tables`, (err, stdout, stderr) => {
        process.exec(`iptables -t mangle -A PREROUTING -m set --match-set ${body.source_addr_ip} src -j MARK --set-mark ${body.strategy_number}`, (err, stdout, stderr) => {
          process.exec(`iptables-save > /etc/iptables/rules.v4`, (err, stdout, stderr) => {
            process.exec(`ip rule add fwmark ${body.strategy_number} table ${body.strategy_number}`, (err, stdout, stderr) => {
              process.exec(`ip route add default via ${body.next_nat_router} dev ${body.nat_router} table ${body.strategy_number}`, (err, stdout, stderr) => resolve())
            })
          })
        })
      })
    }
    
  })
}