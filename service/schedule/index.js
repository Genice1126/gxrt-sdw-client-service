const schedule = require('node-schedule');
const EmitEvent = require('../websocket/emit-event');
const {basicCommand, interfaceCommand, diagnoseCommand, manetCommand, domainAccelerCommand} = require('../../extend/command');
const Helper = require('../../extend/helper');
const CONFIG = require('../../config/index');
const axios = require('axios');

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
  interfaceFlowScheduleTask: {
    MAX_64BIT_UINT: BigInt(Number.MAX_SAFE_INTEGER),  //18446744073709551615 最大字节数
    flow_interval: 60,   //间隔时间
    count: 0,
    last: {},
    job: null,
    startMission: function(client) {
      this.job = schedule.scheduleJob(`* * * * *`, async () => {
        const date = (Math.floor(new Date().getTime() / 1000)) * 1000;
        const vmnic_count = await basicCommand.vmnicCount();
        const virtual_name = await interfaceCommand.interfaceVirtualName();
        const interface_name = Array.from({ length: vmnic_count }, (_, i) => `GE${i}`);
        const interface_array = interface_name.concat(virtual_name); 
        for(let i = 0; i < interface_array.length; i++) {
          let [rx_flow, rx_packet, tx_flow, tx_packet] = await Promise.all([
            interfaceCommand.interfaceRxFlow(interface_array[i]),
            interfaceCommand.interfaceRxPacket(interface_array[i]),
            interfaceCommand.interfaceTxFlow(interface_array[i]),
            interfaceCommand.interfaceTxPacket(interface_array[i])
          ])
          rx_flow = BigInt(rx_flow), rx_packet = BigInt(rx_packet), tx_flow = BigInt(tx_flow), tx_packet = BigInt(tx_packet);
          if(!this.last[interface_array[i]]) {
            this.last[interface_array[i]] = {};
            this.last[interface_array[i]].rx_flow = rx_flow;
            this.last[interface_array[i]].rx_packet = rx_packet;
            this.last[interface_array[i]].tx_flow = tx_flow;
            this.last[interface_array[i]].tx_packet = tx_packet;
          } else {
            let cur_rx_flow, cur_rx_packet, cur_tx_flow, cur_tx_packet;
            (rx_flow < this.last[interface_array[i]].rx_flow) ? cur_rx_flow = (this.MAX_64BIT_UINT - this.last[interface_array[i]].rx_flow) + rx_flow : cur_rx_flow = rx_flow - this.last[interface_array[i]].rx_flow;
            (rx_packet < this.last[interface_array[i]].rx_packet) ? cur_rx_packet = (this.MAX_64BIT_UINT - this.last[interface_array[i]].rx_packet) + rx_packet : cur_rx_packet = rx_packet - this.last[interface_array[i]].rx_packet;
            (tx_flow < this.last[interface_array[i]].tx_flow) ? cur_tx_flow = (this.MAX_64BIT_UINT - this.last[interface_array[i]].tx_flow) + tx_flow : cur_tx_flow = tx_flow - this.last[interface_array[i]].tx_flow;
            (tx_packet < this.last[interface_array[i]].tx_packet) ? cur_tx_packet = (this.MAX_64BIT_UINT - this.last[interface_array[i]].tx_packet) + tx_packet : cur_tx_packet = tx_packet - this.last[interface_array[i]].tx_packet;
            this.last[interface_array[i]].rx_flow = rx_flow;
            this.last[interface_array[i]].rx_packet = rx_packet;
            this.last[interface_array[i]].tx_flow = tx_flow;
            this.last[interface_array[i]].tx_packet = tx_packet;
            const exec_res = {
              interface_name: interface_array[i], 
              tx_flow: Math.ceil((Number(cur_tx_flow) * 8) / this.flow_interval), 
              tx_packet: Math.ceil(Number(cur_tx_packet) / this.flow_interval), 
              rx_flow: Math.ceil((Number(cur_rx_flow) * 8) / this.flow_interval),
              rx_packet: Math.ceil(Number(cur_rx_packet) / this.flow_interval),
              create_time: date
            }
            EmitEvent.emitInterfaceFlow(client, exec_res)
          } 
        }
      });
    },
    stopMission: function() {
      schedule.cancelJob(this.job);
    }
  },
  manetInterfaceDelayScheduleTask: {
    manet_path: "/etc/NetworkManager/system-connections",
    job: null,
    startMission: function(client) {
      this.job = schedule.scheduleJob('*/10 * * * * *', async () => {
        const file_name_gather = await Helper.readDir(this.manet_path);
        if(file_name_gather.length !== 0) {
          const filter_files = file_name_gather.filter(file => file.includes("wg"));
          for(let i = 0 ; i < filter_files.length; i++) {
            const interface_name = filter_files[i].split(".")[0];
            const num = interface_name.match(/([a-zA-Z]+)(\d+)/)[2];
            const exec_res = await manetCommand.manetInterfaceDelay(`172.31.${255 - Number(num)}.1`);
            const packet_loss_regex = /(\d+)% packet loss/;
            const packet_loss_match = exec_res.match(packet_loss_regex);
            const packet_loss = packet_loss_match ? packet_loss_match[1] : null;
            const rtt_regex = /rtt min\/avg\/max\/mdev = (\d+\.\d+)\/(\d+\.\d+)\/(\d+\.\d+)\/(\d+\.\d+) ms/;
            const rtt_match = exec_res.match(rtt_regex);
            const rtt_min = rtt_match ? rtt_match[1] : null;
            const rtt_avg = rtt_match ? rtt_match[2] : null;
            const rtt_max = rtt_match ? rtt_match[3] : null;
            const rtt_mdev = rtt_match ? rtt_match[4] : null;
            const send_body = {interface_name, packet_loss, rtt_min, rtt_avg, rtt_max, rtt_mdev}
            EmitEvent.emitManetInterfaceDelay(client, send_body);
          }
        }
      })
    },
    stopMission: function() {
      schedule.cancelJob(this.job);
    }
  },
  domainAccelerScheduleTask: {
    jobs: {},
    startMission: function(client) {
      this.job = schedule.scheduleJob('*/30 * * * * *', async() => {
        /**
         * 先检测
         * 先检测文件是否存在 
         */
        const file_is_exists = await Helper.existsFiles('/etc/dnsmasq.d/', 'outside.conf');
        if(!file_is_exists) return;
        const res = await diagnoseCommand.diagnoseAddPing('172.16.1.165', 1);
        const reg_res = res.match(/,(.*)(\S*)received/);
        let commandRes = 0;
        if(reg_res) commandRes = (parseInt(stdout.match(/,(.*)(\S*)received/)[1]) == 0) ? 0 : 1;
        if(commandRes == 1) return;
        /**
         * 测试
         * 根据存储的pop文件 http 拿到所有pop点的ip地址
         * 每一个ip地址测速 并记录时间
         * 取出时间最小的
         * pop: pop_id_array, dns_analy_before: '8.8.8.8', dns_analy_after: domain_acceler_dns_analy, domain_list: white_list[0].domain
         */
        const ctx = await Helper.readFiles(CONFIG.SCHEDULE_DOMAIN_ACCELER_PATH, "vpn.js");
        let ctx_json = JSON.parse(ctx);
        const response = await axios.post('https://www.baidu.com', {
            pop_id_array: ctx_json.pop,
        });
        let addr_array = [];
        for(let i = 0 ; i < response.length; i++) {
          let addr = JSON.parse(response[i].pop_ip_address);
          for(let m = 0; m < addr.length; m++) {
            addr_array.push(addr[m].ip);
          }
        }
        let max_obj = {ip: "", avg: 10000};
        for(let n = 0; n < addr_array.length; n++) {
          const res = await diagnoseCommand.diagnoseAddPing(addr_array[n], 1, "", 10, 0.1);
          const rtt_regex = /rtt min\/avg\/max\/mdev = (\d+\.\d+)\/(\d+\.\d+)\/(\d+\.\d+)\/(\d+\.\d+) ms/;
          const rtt_match = res.match(rtt_regex);
          const rtt_avg = rtt_match ? rtt_match[2] : 20000;
          if(rtt_avg < max_obj.avg) max_obj.ip = addr_array[n];
        }
        /**
         * 执行指令
         */
        await domainAccelerCommand.vpnConnection(max_obj.ip);
      })
    },
    stopMission: function() {
      schedule.cancelJob(this.job);
    }
  }
}