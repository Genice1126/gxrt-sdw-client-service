const schedule = require('node-schedule');
const HttpService = require('../index');
const EmitEvent = require('../websocket/emit-event');
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
        const exec_res = await HttpService.__vmnicTargetSyncService();
        for(let i = 0 ; i < exec_res.length; i++) {
          EmitEvent.emitVmnicTargetSyncSocket(client, exec_res[i])
        }
      })
    },
    stopMission: function() {
      schedule.cancelJob(this.job);
    }
  }
}