const schedule = require('node-schedule');
const EmitEvent = require('../websocket/emit-event');
const {basicCommand, interfaceCommand, diagnoseCommand} = require('../../extend/command');
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
  },
  interfaceFlowCollectScheduleTask: {
    MAX_64BIT_UINT: Number.MAX_SAFE_INTEGER,  //18446744073709551615 最大字节数
    flow_interval: 30,   //间隔时间
    count: 0,
    last: {},
    job: null,
    startMission: function(client) {
      this.job = schedule.scheduleJob(`*/${this.flow_interval} * * * * *`, async () => {
        const vmnic_count = await basicCommand.vmnicCount();
        const virtual_name = await interfaceCommand.interfaceVirtualName();
        const interface_name = Array.from({ length: vmnic_count }, (_, i) => `GE${i}`);
        const interface_array = interface_name.concat(virtual_name);
        console.log('interface_array===>>', interface_array);        
        for(let i = 0; i < interface_array.length; i++) {
          let [rx_flow, rx_packet, tx_flow, tx_packet] = await Promise.all([
            interfaceCommand.interfaceRxFlowCollect(interface_array[i]),
            interfaceCommand.interfaceRxPacketCollect(interface_array[i]),
            interfaceCommand.interfaceTxFlowCollect(interface_array[i]),
            interfaceCommand.interfaceTxPacketCollect(interface_array[i])
          ])
          console.log('rx_flow 1==> ', rx_flow)
          console.log('rx_packet 1==> ', rx_packet)
          console.log('tx_flow 1==> ', tx_flow)
          console.log('tx_packet 1==> ', tx_packet)
          if(!this.last[interface_array[i]]) {
            this.last[interface_array[i]] = {};
            this.last[interface_array[i]].rx_flow = rx_flow;
            this.last[interface_array[i]].rx_packet = rx_packet;
            this.last[interface_array[i]].tx_flow = tx_flow;
            this.last[interface_array[i]].tx_packet = tx_packet;
          } else {
            (rx_flow < this.last[interface_array[i]].rx_flow) ? rx_flow = (this.MAX_64BIT_UINT - this.last[interface_array[i]].rx_flow) + rx_flow : rx_flow = rx_flow - this.last[interface_array[i]].rx_flow;
            (rx_packet < this.last[interface_array[i]].rx_packet) ? rx_packet = (this.MAX_64BIT_UINT - this.last[interface_array[i]].rx_packet) + rx_packet : rx_packet = rx_packet - this.last[interface_array[i]].rx_packet;
            (tx_flow < this.last[interface_array[i]].tx_flow) ? tx_flow = (this.MAX_64BIT_UINT - this.last[interface_array[i]].tx_flow) + tx_flow : tx_flow = tx_flow - this.last[interface_array[i]].tx_flow;
            (tx_packet < this.last[interface_array[i]].tx_packet) ? tx_packet = (this.MAX_64BIT_UINT - this.last[interface_array[i]].tx_packet) + tx_packet : tx_packet = tx_packet - this.last[interface_array[i]].tx_packet;
            console.log('rx_flow 2==> ', rx_flow)
            console.log('rx_packet 2==> ', rx_packet)
            console.log('tx_flow 2==> ', tx_flow)
            console.log('tx_packet 2==> ', tx_packet)
            const exec_res = {
              interface_name: interface_array[i], 
              tx_flow: (tx_flow * 8) / this.flow_interval, 
              tx_packet: tx_packet / this.flow_interval, 
              rx_flow: (rx_flow * 8) / this.flow_interval,
              rx_packet: rx_packet / this.flow_interval
            }
            EmitEvent.emitInterfaceFlowCollect(client, exec_res)
          } 
        }
      });
    },
    stopMission: function() {
      schedule.cancelJob(this.job);
    }
  }
}