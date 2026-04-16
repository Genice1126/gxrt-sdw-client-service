const process = require('child_process');
const Helper = require('../helper');
const CONFIG = require('../../config');
const path = require('path');

//{multi_hop_strategy_adr, multi_hop_strategy_protocol, multi_hop_strategy_ctx}
exports.multiHopStrategyAdd = (adr, protocol, ctx) => {
  return new Promise(async (resolve, rejected) => {
    let host_string = '';
    for(let i = 0 ; i < ctx.length; i++) {
      host_string += ` ${ctx[i].device_multi_alias_name} `
    }
    console.log(`gost-chain start${host_string}-sip ${adr} -xieyi ${protocol}`)
    process.exec(`gost-chain start${host_string}-sip ${adr} -xieyi ${protocol}`, (err, stdout, stderr) => resolve());
  })
}

exports.multiHopStrategyDelete = () => {
  return new Promise(async (resolve, rejected) => {
    return new Promise(async (resolve, rejected) => {
      console.log(`gost-chain stop`)
      process.exec(`gost-chain stop`, (err, stdout, stderr) => resolve());
    })
  })
}

