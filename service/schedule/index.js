const schedule = require('node-schedule');
const HttpService = require('../index');
const EmitEvent = require('../websocket/emit-event');
const {basicCommand, interfaceCommand} = require('../../extend/command/index');
module.exports = {
  osTargetScheduleTask: {
    job: null,
    startMission: function(client){
      this.job = schedule.scheduleJob('*/10 * * * * *', async() => {
        const socket_status = (!global.socketConnectionStatus) ? 0 : 1
        const [cpu, disk, memory, network_status] = await Promise.all([
          basicCommand.cpuFree(),
          basicCommand.diskFree(),
          basicCommand.memoryFree(),
          basicCommand.verifyNetwork()
        ])
        const exec_res = {
          cpu, 
          disk, 
          memory, 
          network_status, 
          socket_status, 
          heart_beat: global.socketHeartBeat
        }
        console.log(`os-target===>>${JSON.stringify(exec_res)}`)
        EmitEvent.emitOsTargetSyncSocket(client, exec_res);
      })
    },
    stopMission: function() {
      schedule.cancelJob(this.job)
    }
  },
  heartBeatScheduleTask: {
    job: null,
    startMission: function(client) {
      this.job = schedule.scheduleJob('*/10 * * * * *', async () => {
        EmitEvent.emitHeartBeatSocket(client, {time: Date.now()})
      })
    },
    stopMission: function() {
      schedule.cancelJob(this.job);
    }
  },
  vmnicTargetScheduleTask: {
    job: null,
    startMission: function(client) {
      this.job = schedule.scheduleJob('* * * * *', async () => {
        const vmnic_count = basicCommand.vmnicCount();
        const data_array = [];
        for(let i = 0 ; i < vmnic_count.length; i++) {
          const vmnic_type = await interfaceCommand.interfaceType(`GE${i}`);
          if(vmnic_type == "WAN") {
            const [access_type, pppoe_account, ip, dns, gateway] = await Promise.all([
              interfaceCommand.interfaceMethod(`GE${i}`),
              basicCommand.pppoeAccount(`GE${i}`),
              basicCommand.networkAddress(`GE${i}`),
              basicCommand.networkDns(`GE${i}`),
              basicCommand.networkGateway(`GE${i}`)
            ]);
            let deploy_access_type, deploy_detail;
            if(access_type.toString() == "auto") deploy_access_type = 1, deploy_detail = {};
            if(access_type.toString() == "pppoe") deploy_access_type = 2, deploy_detail = {username: pppoe_account}
            if(access_type.toString() == "manual") deploy_access_type = 3, deploy_detail = {address: ip, gateway: gateway, dns: dns}
            data_array.push({interface_name: `GE${i}`, interface_type: 1, exec_body: {deploy_access_type: deploy_access_type, deploy_detail: deploy_detail}})
          }
        }
        const [ip, dns, gateway] = await Promise.all([
          basicCommand.networkAddress(`LAN`),
          basicCommand.networkDns(`LAN`),
          basicCommand.networkGateway(`LAN`)
        ]);
        data_array.push({interface_name: `LAN`, interface_type: 2, exec_body: {deploy_access_type: 3, deploy_detail: {address: ip, gateway: gateway, dns: dns}}})
        for(let i = 0; i < data_array.length; i++) {
          EmitEvent.emitVmnicTargetSyncSocket(client, data_array[i])
        }
        // const exec_res = await HttpService.__vmnicTargetSyncService();
        // for(let i = 0 ; i < exec_res.length; i++) {
        //   EmitEvent.emitVmnicTargetSyncSocket(client, exec_res[i])
        // }
      })
    },
    stopMission: function() {
      schedule.cancelJob(this.job);
    }
  }
}