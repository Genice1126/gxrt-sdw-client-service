const process = require('child_process');
const Helper = require('../helper');
const CONFIG = require('../../config');
const path = require('path');

exports.routerStrategyIpAdd = (name, file_data) => {
  return new Promise(async (resolve, rejected) => {
    await Helper.writeFiles(CONFIG.ROUTER_STRATEGY_IP_PATH, `${name}.txt`, JSON.stringify(file_data));
    console.log(`1===>>>ipset create ${name} hash:net hashsize 8192 maxelem 100000`)
    console.log(`2===>>>sed 's/^/add myipset /' ${path.join(CONFIG.ROUTER_STRATEGY_IP_PATH, `${name}.txt`)} >> ipset.restore`)
    console.log(`3===>>>iipset restore -f ipset.restore`)
    process.exec(`ipset create ${name} hash:net hashsize 8192 maxelem 100000`, (err, stdout, stderr) => {
      process.exec(`sed 's/^/add myipset /' ${path.join(CONFIG.ROUTER_STRATEGY_IP_PATH, `${name}.txt`)} >> ipset.restore`, (err, stdout, stderr) => {
        process.exec(`ipset restore -f ipset.restore`, (err, stdout, stderr) => resolve())
      })
    })
  })
}

exports.routerStrategyIpDelete = (name) => {
  return new Promise(async (resolve, rejected) => {
    console.log(`ipset destroy ${name}`)
    process.exec(`ipset destroy ${name}`, (err, stdout, stderr) => resolve());
  })
}

exports.routerStrategyAdd = (body) => {
  return new Promise(async (resolve, rejected) => {
    if(body.source_addr_type == 1) {
      console.log(`1=======>>>echo "${body.strategy_number} ${body.strategy_number}" | tee -a /etc/iproute2/rt_tables`)
      console.log(`1=======>>>iptables -t mangle -A PREROUTING -s ${body.source_addr_ip} -j MARK --set-mark ${body.strategy_number}`)
      console.log(`1=======>>>iptables-save > /etc/iptables/rules.v4`)
      console.log(`1=======>>>ip rule add fwmark ${body.strategy_number} table ${body.strategy_number}`)
      console.log(`1=======>>>ip route add default via ${body.next_nat_router} dev ${body.nat_router} table ${body.strategy_number}`)

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
      console.log(`1=======>>echo "${body.strategy_number} ${body.strategy_number}" | tee -a /etc/iproute2/rt_tables`)
      console.log(`1=======>>iptables -t mangle -A PREROUTING -m set --match-set ${body.source_addr_ip} dst -j MARK --set-mark ${body.strategy_number}`)
      console.log(`1=======>>iptables-save > /etc/iptables/rules.v4`)
      console.log(`1=======>>ip rule add fwmark ${body.strategy_number} table ${body.strategy_number}`)
      console.log(`1=======>>ip route add default via ${body.next_nat_router} dev ${body.nat_router} table ${body.strategy_number}`)
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
      console.log(`1=====>>echo "${body.strategy_number} ${body.strategy_number}" | tee -a /etc/iproute2/rt_tables`)
      console.log(`1=====>>iptables -t mangle -A PREROUTING -m set --match-set ${body.source_addr_ip} src -j MARK --set-mark ${body.strategy_number}`)
      console.log(`1=====>>iptables-save > /etc/iptables/rules.v4`)
      console.log(`1=====>>ip rule add fwmark ${body.strategy_number} table ${body.strategy_number}`)
      console.log(`1=====>>ip route add default via ${body.next_nat_router} dev ${body.nat_router} table ${body.strategy_number}`)
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