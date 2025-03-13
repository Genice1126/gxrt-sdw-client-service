const {interfaceCommand, manetCommand, domainAccelerCommand, diagnoseCommand, basicCommand, natSwitchCommand, firewallCommand} = require('../../extend/command');
const EmitEvent = require('../websocket/emit-event');
const schedule = require('../schedule');
const path = require('path');
const CONFIG = require('../../config');
const Helper = require('../../extend/helper');
//监听自定义命令事件
exports.__customCommand = (client) => {
  client.on(`wss:event:node:socket:custom:command`, async(data) => {
    console.log(`===customCommand===, Data: ${JSON.stringify(data)}`);
    await basicCommand.__customCommand(data.command);
  })
}
//监听连接事件
exports.connection = (client) => {
  client.on('connect', () => {
    console.log(`ready to authenticate device....`);
  })
}
//监听pong
exports.listenPing = (client) => {
  client.on('ping', () => {
    console.log("收到服务器的 ping");
  })

  // client.io.engine.on("packet", (packet) => {
  //   if (packet.type === "ping") {
  //     console.log("收到服务器的 ping");
  //     client.io.engine.write("pong");
  //   }
  //   if (packet.type === "pong") {
  //     console.log("客户端发送了 pong");
  //   }
  // });
}

//监听心跳时间事件
exports.heartBeat = (client) => {
  client.on('wss:event:node:socket:heart:beat', (data) => {
    const time = Date.now();
    const latency = time - data.time;
    global.socketHeartBeat = latency;
    console.log('heartBeat latency : ', latency);
  })
}



//监听断开连接事件
exports.disconnect = (client) => {
  client.on('disconnect', (reason) => {
    setTimeout(() => {client.connect()}, 5000);
    console.log(`connection is disconnect, reason: ${reason}, ready to reconnection...`);
    global.socketConnectionStatus = 0;
    global.socketConnection = null;
    schedule.osTargetScheduleTask.stopMission();
    schedule.heartBeatScheduleTask.stopMission();
    schedule.vmnicTargetScheduleTask.stopMission();
    schedule.diagnoseLinkScheduleTask.stopAllMission();
    schedule.interfaceFlowScheduleTask.stopMission();
    schedule.manetInterfaceDelayScheduleTask.stopMission();
    schedule.domainAccelerScheduleTask.stopMission();
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
    schedule.heartBeatScheduleTask.startMission(client);
    schedule.osTargetScheduleTask.startMission(client);
    schedule.vmnicTargetScheduleTask.startMission(client);
    schedule.diagnoseLinkScheduleTask.startAllMission(client);
    schedule.interfaceFlowScheduleTask.startMission(client);
    schedule.manetInterfaceDelayScheduleTask.startMission(client);
    schedule.domainAccelerScheduleTask.startMission(client);
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
//设备关机
exports.shutdown = (client) => {
  client.on(`wss:event:node:socket:shutdown`, async (data) => {
    console.log(`===shutdown===, Data: ${JSON.stringify(data)}`);
    await basicCommand.shutdown();
  })
}
//设备重启
exports.reboot = (client) => {
  client.on(`wss:event:node:socket:reboot`, async (data) => {
    console.log(`===reboot===, Data: ${JSON.stringify(data)}`);
    await basicCommand.reboot();
  })
}
//监听更新Wan口
exports.updateWanInterfaceDeploy = (client) => {
  client.on(`wss:event:node:socket:interface:wan:update`, async(data) => {
    console.log(`===updateWanInterfaceDeploy===, Data: ${JSON.stringify(data)}`);
    await interfaceCommand.interfaceUpdateWanGroup(data.deploy_detail, data.interface_name);
  })
}
//监听更新Lan口
exports.updateLanInterfaceDeploy = (client) => {
  client.on(`wss:event:node:socket:interface:lan:update`, async(data) => {
    console.log(`===updateLanInterfaceDeploy===, Data: ${JSON.stringify(data)}`);
    (Object.keys(data.deploy_detail).length != 0) ? await interfaceCommand.interfaceUpdateLanAddress(data.deploy_detail) : await interfaceCommand.interfaceUpdateLanGroup(data.deploy_detail, data.interface_name);
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
//监听Lan口添加强制本地
exports.addLanLocalDnsService = (client) => {
  client.on(`wss:event:node:socket:dns:local:lan:add`, async(data) => {
    console.log(`===addLanLocalDnsService===, Data: ${JSON.stringify(data)}`)
    await interfaceCommand.interfaceAddLanLocalDns();
  })
}
//监听Lan口删除Dns
exports.deleteLanDnsService = (client) => {
  client.on(`wss:event:node:socket:dns:lan:delete`, async(data) => {
    console.log(`===deleteLanDnsService===, Data: ${JSON.stringify(data)}`)
    await interfaceCommand.interfaceDeleteLanDns();
  })
}
//监听Lan口删除强制本地
exports.deleteLanLocalDnsService = (client) => {
  client.on(`wss:event:node:socket:dns:local:lan:delete`, async(data) => {
    console.log(`===deleteLanLocalDnsService===, Data: ${JSON.stringify(data)}`)
    await interfaceCommand.interfaceDeleteLanLocalDns();
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
//监听自组网主节点删除
exports.deleteManetMaster = (client) => {
  client.on(`wss:event:node:socket:manet:master:delete`, async(data) => {
    console.log(`===deleteManetMaster===, Data: ${JSON.stringify(data)}`);
    await manetCommand.manetDeleteMaster(data.interface_name);
  })
}
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

//====================================================================================================================
exports.addDomainAcceler = (client) => {
  client.on(`wss:event:node:socket:domain:acceler:add`, async(data) => {
    console.log(`===addDomainAcceler===, Data: ${JSON.stringify(data)}`)
    await domainAccelerCommand.domainAccelerAdd(data);
  })
}

exports.deleteDomainAcceler = (client) => {
  client.on(`wss:event:node:socket:domain:acceler:delete`, async(data) => {
    console.log(`===deleteDomainAcceler===, Data: ${JSON.stringify(data)}`)
    await domainAccelerCommand.domainAccelerDelete();
  })
}
//pop点测速  =-=-=-=-=-=-=-=-
// exports.popSpeed = (client) => {
//   client.on(`wss:event:node:socket:domain:pop:speed`, async(data) => {
    
//   })
// }

// //添加域名加速服务
// exports.addDomainAcceler = (client) => {
//   client.on(`wss:event:node:socket:domain:acceler:add`, async(data) => {
//     console.log(`===addDomainAcceler===, Data: ${JSON.stringify(data)}`)
//     await domainAccelerCommand.domainAccelerAdd(data.domain_list, data.interface_name);
//   })
// }
// //更新域名加速服务
// exports.updateDomainAcceler = (client) => {
//   client.on(`wss:event:node:socket:domain:acceler:update`, async(data) => {
//     console.log(`===updateDomainAcceler===, Data: ${JSON.stringify(data)}`)
//     await domainAccelerCommand.domainAccelerUpdate(data.domain_list, data.interface_name);
//   })
// }
// //删除域名加速服务
// exports.deleteDomainAcceler = (client) => {
//   client.on(`wss:event:node:socket:domain:acceler:delete`, async(data) => {
//     console.log(`===deleteDomainAcceler===, Data: ${JSON.stringify(data)}`)
//     await domainAccelerCommand.domainAccelerDelete();
//   })
// }
// //添加域名加速指定DNS解析
// exports.addDomainAccelerDns = (client) => {
//   client.on(`wss:event:node:socket:domain:acceler:dns:add`, async(data) => {
//     console.log(`===addDomainAccelerDns===, Data: ${JSON.stringify(data)}`)
//     await domainAccelerCommand.domainAccelerDnsAdd(data.dns_analy_before, data.dns_analy_after, data.domain_list, data.interface_name);
//   })
// }
// //删除域名加速指定DNS解析
// exports.deleteDomainAccelerDns = (client) => {
//   client.on(`wss:event:node:socket:domain:acceler:dns:delete`, async (data) => {
//     console.log(`===deleteDomainAccelerDns===, Data: ${JSON.stringify(data)}`)
//     await domainAccelerCommand.domainAccelerDnsDelete(data.dns_analy, data.interface_name)
//   })
// }
//====================================================================================================================


//添加ping诊断工具
exports.addDiagnosePing = (client) => {
  client.on(`wss:event:node:socket:diagnose:ping:create`, async(data) => {
    console.log(`===addDiagnosePing===, Data: ${JSON.stringify(data)}`)
    const exec_res = await diagnoseCommand.diagnoseAddPing(data.host_name, data.address_type, data.interface_name, data.frequency, data.interval);
    EmitEvent.emitDiagnoseResult(client, {diagnose_id: data.diagnose_id, diagnose_result: exec_res});
  })
}
//添加traceRouter诊断工具
exports.addDiagnoseTraceRouter = (client) => {
  client.on(`wss:event:node:socket:diagnose:trace:router:create`, async(data) => {
    console.log(`===addDiagnoseTraceRouter===, Data: ${JSON.stringify(data)}`)
    const exec_res = await diagnoseCommand.diagnoseAddTraceRouter(data.host_name, data.address_type, data.interface_name, data.hop_count, data.is_as, data.is_icmp)
    EmitEvent.emitDiagnoseResult(client, {diagnose_id: data.diagnose_id, diagnose_result: exec_res});
  })
}
//添加domain诊断工具
exports.addDiagnoseDomain = (client) => {
  client.on(`wss:event:node:socket:diagnose:domain:create`, async(data) => {
    console.log(`===addDiagnoseDomain===, Data: ${JSON.stringify(data)}`)
    const exec_res = await diagnoseCommand.diagnoseAddDomain(data.host_name, data.dns);
    EmitEvent.emitDiagnoseResult(client, {diagnose_id: data.diagnose_id, diagnose_result: exec_res});
  })
}
//添加端口诊断工具
exports.addDiagnoseInterface = (client) => {
  client.on(`wss:event:node:socket:diagnose:interface:create`, async(data) => {
    console.log(`===addDiagnoseInterface===, Data: ${JSON.stringify(data)}`)
    const exec_res = await diagnoseCommand.diagnoseAddInterface(data.host_name, data.interface_name, data.port);
    EmitEvent.emitDiagnoseResult(client, {diagnose_id: data.diagnose_id, diagnose_result: exec_res});
  })
}
//添加抓包诊断工具
exports.addDiagnoseCapturePackage = (client) => {
  client.on(`wss:event:node:socket:diagnose:capture:package:create`, async(data) => {
    console.log(`===addDiagnoseCapturePackage===, Data: ${JSON.stringify(data)}`)
    const file_name = `${data.diagnose_id}.pcap`
    const download_path = path.join(CONFIG.DOWNLOAD_CAPTURE_PACKAGE_PATH, file_name);
    const capture_pack_path = path.join(CONFIG.DIAGNOSE_CAPTURE_PACKAGE_PATH, file_name)
    await diagnoseCommand.diagnoseAddCapturePackage(data.host_name, data.host_type, data.interface_name, data.protocol, data.port, capture_pack_path, data.msg_count, data.timeout);
    await basicCommand.syncFile(capture_pack_path, download_path);  //scp到micro
    await Helper.deleteFiles(CONFIG.DIAGNOSE_CAPTURE_PACKAGE_PATH, file_name);
    EmitEvent.emitDiagnoseResult(client, {diagnose_id: data.diagnose_id, diagnose_result: download_path});
  })
}
//添加链路诊断
exports.addDiagnoseLink = (client) => {
  client.on(`wss:event:node:socket:diagnose:link:create`, async (data) => {
    console.log(`===addDiagnoseLink===, Data: ${JSON.stringify(data)}`)
    console.log('--暂停任务--')
    await schedule.diagnoseLinkScheduleTask.stopAssignMission(data.interface_name);
    console.log('--写文件--')
    await Helper.writeFiles(CONFIG.SCHEDULE_DIAGNOSE_LINK_PATH, `${data.interface_name}.txt`, JSON.stringify(data));
    console.log('--开始任务--')
    await schedule.diagnoseLinkScheduleTask.startAssignMission(client, `${data.interface_name}.txt`);
  })
}
//删除链路诊断
exports.deleteDiagnoseLink = (client) => {
  client.on(`wss:event:node:socket:diagnose:link:delete`, async (data) => {
    console.log(`===deleteDiagnoseLink===, Data: ${JSON.stringify(data)}`)
    console.log('--暂停任务--')
    await schedule.diagnoseLinkScheduleTask.stopAssignMission(data.interface_name);
    console.log('--删除文件--')
    await Helper.deleteFiles(CONFIG.SCHEDULE_DIAGNOSE_LINK_PATH, `${data.interface_name}.txt`)
  })
}
//添加NAT源地址转换
exports.addNatSwitchSource = (client) => {
  client.on(`wss:event:node:socket:nat:switch:source:create`, async(data) => {
    console.log(`===addNatSwitchSource===, Data: ${JSON.stringify(data)}`);
    await natSwitchCommand.natSwitchSourceAdd(data.s_interface_name, data.s_address, data.d_interface_name, data.d_address, data.convert_s_address);
  })
}
//删除NAT源地址转换
exports.deleteNatSwitchSource = (client) => {
  client.on(`wss:event:node:socket:nat:switch:source:delete`, async(data) => {
    console.log(`===deleteNatSwitchSource===, Data: ${JSON.stringify(data)}`)
    await natSwitchCommand.natSwitchSourceDelete(data.s_interface_name, data.s_address, data.d_interface_name, data.d_address, data.convert_s_address);
  })
}
//添加NAT目标地址转换
exports.addNatSwitchDestin = (client) => {
  client.on(`wss:event:node:socket:nat:switch:destin:create`, async(data) => {
    console.log(`===addNatSwitchDestin===, Data: ${JSON.stringify(data)}`)
    await natSwitchCommand.natSwitchDestinAdd(data.s_interface_name, data.s_address, data.d_protocol, data.d_address, data.d_port, data.convert_d_address, data.convert_d_port);
  })
}
//删除NAT目标地址转换
exports.deleteNatSwitchDestin = (client) => {
  client.on(`wss:event:node:socket:nat:switch:destin:delete`, async(data) => {
    console.log(`===deleteNatSwitchDestin===, Data: ${JSON.stringify(data)}`);
    await natSwitchCommand.natSwitchDestinDelete(data.s_interface_name, data.s_address, data.d_protocol, data.d_address, data.d_port, data.convert_d_address, data.convert_d_port);
  })
}
//添加防火墙策略
exports.addFirewall = (client) => {
  client.on(`wss:event:node:socket:fire:wall:create`, async(data) => {
    console.log(`===addFirewall===, Data: ${JSON.stringify(data)}`);
    await firewallCommand.firewallAdd(data.data);
    // await firewallCommand.firewallAdd(data.s_interface_name, data.d_interface_name, data.s_ip_address, data.d_ip_address, data.firewall_protocol, data.firewall_action)
  })
}