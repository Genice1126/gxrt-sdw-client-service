const {interfaceCommand, manetCommand, domainAccelerCommand} = require('../../extend/command');
const schedule = require('../schedule');

//监听连接事件
exports.connection = (client) => {
  client.on('connect', () => {
    console.log(`ready to authenticate device....`);
  })
}
//监听心跳时间事件
exports.heartBeat = (client) => {
  client.on('wss:event:node:socket:heartBeat', (data) => {
    const time = Date.now();
    const latency = time - data.time;
    global.socketHeartBeat = latency;
    console.log('heartBeat latency : ', latency);
  })
}
//监听断开连接事件
exports.disconnect = (client) => {
  client.on('disconnect', () => {
    setTimeout(() => {client.connect()}, 5000);
    console.log(`connection is disconnect, ready to reconnection...`);
    global.socketConnectionStatus = 0;
    global.socketConnection = null;
    schedule.osTargetScheduleTask.stopMission();
    schedule.heartBeatScheduleTask.stopMission();
    schedule.vmnicTargetScheduleTask.stopMission();
  })
}
//监听连接错误事件
exports.connect_error = (client) => {
  client.on('connect_error', (e) => {
    global.socketConnection = null;
    global.socketConnectionStatus = 0
    setTimeout(() => {client.connect()}, 5000);
    console.log(`connection is error: ${e}`)
  })
}
//监听设备认证通过
exports.authenticated = (client) => {
  client.on(`wss:event:node:socket:authenticated`, (data) => {
    console.log(`connection is successfully...`);
    global.socketConnectionStatus = 1;
    schedule.heartBeatScheduleTask.startMission();
    schedule.osTargetScheduleTask.startMission();
    schedule.vmnicTargetScheduleTask.startMission();
  })
}
//监听设备认证未通过
exports.unauthorized = (client) => {
  client.on(`wss:event:node:socket:unauthorized`, () => {
    console.log(`connection is refuse, please use authenticated device....`);
    global.socketConnectionStatus = 0
    global.socketConnection = null;
  })
}
//监听更新Wan口
exports.updateWanInterfaceDeploy = (client) => {
  client.on(`wss:event:node:socket:interface:wan:update`, async(data) => {
    console.log(`===updateWanInterfaceDeploy===, Data: ${JSON.stringify(data)}`)
    await interfaceCommand.interfaceUpdateWanGroup(data.deploy_detail, data.interface_name);
  })
}
//监听更新Lan口
exports.updateLanInterfaceDeploy = (client) => {
  client.on(`wss:event:node:socket:interface:lan:update`, async(data) => {
    console.log(`===updateLanInterfaceDeploy===, Data: ${JSON.stringify(data)}`)
    (Object.keys(data.deploy_detail).length !== 0) ? 
      await interfaceCommand.interfaceUpdateLanAddress(data.deploy_detail) :
      await interfaceCommand.interfaceUpdateLanGroup(data.deploy_detail, data.interface_name)
  })
}
//监听端口添加静态路由
exports.addInterfaceStaticRouter = (client) => {
  client.on(`wss:event:node:socket:static:router:add`, async(data) => {
    console.log(`===addInterfaceStaticRouter===, Data: ${JSON.stringify(data)}`)
    await interfaceCommand.interfaceAddStaticRouter(data.target, data.next, data.interface_name);
  })
}
//监听端口删除静态路由
exports.deleteInterfaceStaticRouter = (client) => {
  client.on(`wss:event:node:socket:static:router:delete`, async(data) => {
    console.log(`===deleteInterfaceStaticRouter===, Data: ${JSON.stringify(data)}`)
    await interfaceCommand.interfaceDeleteStaticRouter(data.target, data.next, data.interface_name);
  })
}
//监听Lan口添加Dhcp
exports.addLanDhcpService = (client) => {
  client.on(`wss:event:node:socket:dhcp:lan:add`, async(data) => {
    console.log(`===addLanDhcpService===, Data: ${JSON.stringify(data)}`)
    await interfaceCommand.interfaceAddLanDhcp(
      data.start, 
      data.end, 
      data.gateway, 
      data.dns, 
      data.tenancy
    );
  })
}
//监听Lan口删除Dhcp
exports.deleteLanDhcpService = (client) => {
  client.on(`wss:event:node:socket:dhcp:lan:delete`, async(data) => {
    console.log(`===deleteLanDhcpService===, Data: ${JSON.stringify(data)}`)
    await interfaceCommand.interfaceDeleteLanDhcp();
  })
}
//监听Lan口添加Dns
exports.addLanDnsService = (client) => {
  client.on(`wss:event:node:socket:dns:lan:add`, async(data) => {
    console.log(`===addLanDnsService===, Data: ${JSON.stringify(data)}`)
    await interfaceCommand.interfaceAddLanDns(
      data.address, 
      data.port, 
      data.cache_size, 
      data.upstream, 
      data.analysis
    );
  })
}
//监听Lan口删除Dns
exports.deleteLanDnsService = (client) => {
  client.on(`wss:event:node:socket:dns:lan:delete`, async(data) => {
    console.log(`===deleteLanDnsService===, Data: ${JSON.stringify(data)}`)
    await interfaceCommand.interfaceDeleteLanDns();
  })
}
//监听创建自组网主节点
exports.addManetMaster = (client) => {
  client.on(`wss:event:node:socket:manet:master:add`, async(data) => {
    console.log(`===addManetMaster===, Data: ${JSON.stringify(data)}`)
    await manetCommand.manetCreateMaster(
      data.manet_private_key, 
      "ipv4", 
      data.address, 
      data.address_port, 
      data.branch, 
      data.interface_name
    );
  })
}
//监听自组网主节点更新
exports.updateManetMaster = (client) => {
  client.on(`wss:event:node:socket:manet:master:update`, async(data) => {
    console.log(`===updateManetMaster===, Data: ${JSON.stringify(data)}`)
    await manetCommand.manetUpdateMaster(data.branch, data.interface_name);
  })
}
//监听自组网删除分支节点后，在主节点的配置文件中删除对应值
// exports.deleteManetBranchInMaster = (client) => {
//   client.on(`wss:event:node:socket:manet:branch:in:master:delete`, async(data) => {
//     console.log(`===deleteManetBranchInMaster===, Data: ${JSON.stringify(data)}`)
//   })

// }
//监听自组网创建分支
exports.addManetBranch = (client) => {
  client.on(`wss:event:node:socket:manet:branch:add`, async(data) => {
    console.log(`===addManetBranch===, Data: ${JSON.stringify(data)}`)
    await manetCommand.manetCreateBranch(
      data.manet_private_key, 
      "ipv4",
      data.address, 
      data.master,
      data.interface_name
    );
  })
}
//监听自组网删除分支
exports.deleteManetBranch = (client) => {
  client.on(`wss:event:node:socket:manet:branch:delete`, async(data) => {
    console.log(`===deleteManetBranch===, Data: ${JSON.stringify(data)}`)
    await manetCommand.manetDeleteBranch(data.interface_name);
  })
}
//添加域名加速服务
exports.addDomainAcceler = (client) => {
  client.on(`wss:event:node:socket:domain:acceler:add`, async(data) => {
    console.log(`===addDomainAcceler===, Data: ${JSON.stringify(data)}`)
    await domainAccelerCommand.domainAccelerAdd(data.domain_list, data.interface_name);
  })
}
//更新域名加速服务
exports.updateDomainAcceler = (client) => {
  client.on(`wss:event:node:socket:domain:acceler:update`, async(data) => {
    console.log(`===updateDomainAcceler===, Data: ${JSON.stringify(data)}`)
    await domainAccelerCommand.domainAccelerUpdate(data.domain_list, data.interface_name);
  })
}
//删除域名加速服务
exports.deleteDomainAcceler = (client) => {
  client.on(`wss:event:node:socket:domain:acceler:delete`, async(data) => {
    console.log(`===deleteDomainAcceler===, Data: ${JSON.stringify(data)}`)
    await domainAccelerCommand.domainAccelerDelete();
  })
}
//添加域名加速指定DNS解析
exports.addDomainAccelerDns = (client) => {
  client.on(`wss:event:node:socket:domain:acceler:dns:add`, async(data) => {
    console.log(`===addDomainAccelerDns===, Data: ${JSON.stringify(data)}`)
    await domainAccelerCommand.domainAccelerDnsAdd(data.dns_analy_before, data.dns_analy_after, data.domain_list, data.interface_name);
  })
}
//删除域名加速指定DNS解析
exports.deleteDomainAccelerDns = (client) => {
  client.on(`wss:event:node:socket:domain:acceler:dns:delete`, async (data) => {
    console.log(`===deleteDomainAccelerDns===, Data: ${JSON.stringify(data)}`)
    await domainAccelerCommand.domainAccelerDnsDelete(data.dns_analy, data.interface_name)
  })
}