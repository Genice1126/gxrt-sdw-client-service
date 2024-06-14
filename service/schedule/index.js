const schedule = require('node-schedule');
const EmitEvent = require('../websocket/emit-event');
const {basicCommand, diagnoseCommand} = require('../../extend/command');
const Helper = require('../../extend/helper');
const CONFIG = require('../../config/index');
module.exports = {
  osTargetScheduleTask: {
    job: null,
    startMission: function(client){
      this.job = schedule.scheduleJob('* * * * *', async() => {
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
        for(let i = 0 ; i < exec_res.length; i++) {
          EmitEvent.emitVmnicTargetSyncSocket(client, exec_res[i])
        }
      })
    },
    stopMission: function() {
      schedule.cancelJob(this.job);
    }
  },
  diagnoseLinkScheduleTask: {
    count: {},
    jobs: {},
    startAssignMission: async function(client, file_name) {
      const file_ctx = await Helper.readFiles(CONFIG.SCHEDULE_DIAGNOSE_LINK_PATH, file_name);
      const file_json = JSON.parse(file_ctx);
      const schedule_time = (file_json.diagnose_link_interval == '60') ? '* * * * *' : `*/${file_json.diagnose_link_interval} * * * * *`;
      this.count[file_json.interface_name] = 0;
      this.jobs[file_json.interface_name] = schedule.scheduleJob(schedule_time, async() => {
        for(let i = 0; i < file_json.diagnose_link_params.host.length; i++) {
          if(file_json.diagnose_link_method_type == 1) {
            const exec_res = await diagnoseCommand.diagnoseAddPing(file_json.diagnose_link_params.host[i], "1", file_json.interface_name, "1", file_json.diagnose_link_interval);
            const reg_res = exec_res.match(/,(.*)(\S*)received/);
            if(reg_res && parseInt(exec_res.match(/,(.*)(\S*)received/)[1]) != 0) {
              this.count[file_json.interface_name] = 0;
              break;
            } else if(i == file_json.diagnose_link_params.host.length - 1){
              this.count[file_json.interface_name]++;
            }
          }else {
            const source_addr_sub = await basicCommand.networkAddress(file_json.interface_name);
            const source_addr = source_addr_sub.split("/")[0];
            const exec_res = await diagnoseCommand.diagnoseAddDigDomain(source_addr, file_json.diagnose_link_params.host[i], file_json.diagnose_link_params.domain);
            const reg_res = exec_res.includes("timed out");
            if(!reg_res) {
              this.count[file_json.interface_name] = 0;
              break;
            }else if(i == file_json.diagnose_link_params.host.length - 1){
              this.count[file_json.interface_name]++;
            }
          }
        }
        console.log(`===链路诊断=== 端口:${file_json.interface_name} , 当前失败次数:${this.count[file_json.interface_name]}`)
        if(this.count[file_json.interface_name] >= file_json.diagnose_link_failure_threshold) {
          await basicCommand.systemLogger('warn', 'diagnose-link', `${file_json.interface_name}链路检测-Error`);
        }
      })
    },
    startAllMission: async function(client) {
      const file_name_gather = await Helper.readDir(CONFIG.SCHEDULE_DIAGNOSE_LINK_PATH);
      if(file_name_gather.length == 0) return;
      for(let i = 0 ; i < file_name_gather.length; i++) {
        const file_ctx = await Helper.readFiles(CONFIG.SCHEDULE_DIAGNOSE_LINK_PATH, file_name_gather[i]);
        const file_json = JSON.parse(file_ctx);
        const schedule_time = (file_json.diagnose_link_interval == '60') ? '* * * * *' : `*/${file_json.diagnose_link_interval} * * * * *`;
        this.count[file_json.interface_name] = 0;
        this.jobs[file_json.interface_name] = schedule.scheduleJob(schedule_time, async() => {
          for(let i = 0; i < file_json.diagnose_link_params.host.length; i++) {
            if(file_json.diagnose_link_method_type == 1) {
              const exec_res = await diagnoseCommand.diagnoseAddPing(file_json.diagnose_link_params.host[i], "1", file_json.interface_name, "1", file_json.diagnose_link_interval);
              const reg_res = exec_res.match(/,(.*)(\S*)received/);
              if(reg_res && parseInt(exec_res.match(/,(.*)(\S*)received/)[1]) != 0) {
                this.count[file_json.interface_name] = 0;
                break;
              } else if(i == file_json.diagnose_link_params.host.length - 1){
                this.count[file_json.interface_name]++;
              }
            }else {
              const source_addr_sub = await basicCommand.networkAddress(file_json.interface_name);
              const source_addr = source_addr_sub.split("/")[0];
              const exec_res = await diagnoseCommand.diagnoseAddDigDomain(source_addr, file_json.diagnose_link_params.host[i], file_json.diagnose_link_params.domain);
              const reg_res = exec_res.includes("timed out");
              if(!reg_res) {
                this.count[file_json.interface_name] = 0;
                break;
              }else if(i == file_json.diagnose_link_params.host.length - 1){
                this.count[file_json.interface_name]++;
              }
            }
          }
          console.log(`===链路诊断=== 端口:${file_json.interface_name} , 当前失败次数:${this.count[file_json.interface_name]}`)
          if(this.count[file_json.interface_name] >= file_json.diagnose_link_failure_threshold) {
            await basicCommand.systemLogger('warn', 'diagnose-link', `${file_json.interface_name}链路检测-Error`);
          }
        })
      }
    },
    stopAssignMission: async function(interface_name) {
      schedule.cancelJob(this.jobs[interface_name]);
      delete this.jobs[interface_name];
      delete this.count[interface_name];
    },
    stopAllMission: async function() {
      Object.keys(this.jobs).forEach(key => {
        const job = this.jobs[key];
        schedule.cancelJob(job);
        delete this.jobs[key];
        delete this.count[key];
        console.log(`取消定时任务 ${key}`);
      });
    }
  }
}