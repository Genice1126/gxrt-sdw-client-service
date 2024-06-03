const schedule = require('node-schedule');
const EmitEvent = require('../websocket/emit-event');
module.exports = {
  osTargetScheduleTask: {
    job: null,
    startMission: function(client){
      this.job = schedule.scheduleJob('*/10 * * * * *', async() => {
        const HttpService = require('../index');
        const exec_res = await HttpService.__osTargetSyncService();
        EmitEvent.emitOsTargetSyncSocket(client, exec_res)
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
        const HttpService = require('../index');
        const exec_res = await HttpService.__vmnicTargetSyncService();
        console.log('exec_res==>', exec_res);
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