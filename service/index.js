const CONFIG = require('../config');
const BaseServer = require("./base");
const Helper = require('../extend/helper');
const websocket = require('../service/websocket');
const EmitEvent = require('./websocket/emit-event');
const {basicCommand, interfaceCommand} = require('../extend/command/index');


class HttpService extends BaseServer {
  
  constructor() {
    super();
  }

  /**
   * 登录
   */
  static async loginService(req, res) {
    try {
      const account = req.body.account;
      const password = req.body.password;
      const service_file_ctx = JSON.parse((await Helper.readFiles(CONFIG.SERVICE_CONFIG_PATH, CONFIG.SERVICE_CONFIG_NAME)).toString());
      if(account !== service_file_ctx.ACCOUNT) return super.failure(res, 500, 'account_error');
      if(password !== service_file_ctx.PASSWORD) return super.failure(res, 500, 'password_error');
      const device_sn = await basicCommand.readDeviceSerial() || "未知";
      return super.success(res, {sn: device_sn, progress: service_file_ctx.CONNECTED});
    } catch(e) {
      console.log('login-error==>>', e);
      return super.failure(res);
    }
  }
  /**
   * 修改密码
   */
  static async updatePwdService(req, res) {
    try {
      const {old_password, new_password} = req.body;
      const service_file_ctx = JSON.parse((await Helper.readFiles(CONFIG.SERVICE_CONFIG_PATH, CONFIG.SERVICE_CONFIG_NAME)).toString());
      if(old_password !== service_file_ctx.PASSWORD) return super.failure(res, 500, 'password_error')
      service_file_ctx.PASSWORD = new_password;
      await Helper.writeFiles(CONFIG.SERVICE_CONFIG_PATH, CONFIG.SERVICE_CONFIG_NAME, JSON.stringify(service_file_ctx))
      return super.success(res);
    } catch(e) {
      console.log('modifyPassword-error==>', e);
      return super.failure(res);
    }
  }
  /**
   * 配置上网信息 初始化wan口
   */
  static async interfaceWanInitService(req, res) {
    try {
      const {deploy_access_type, deploy_detail} = req.body;
      let access_type;
      (deploy_access_type == 2) ? access_type = "pppoe" : access_type = "ethernet"
      await interfaceCommand.interfaceUpdateWanGroup(deploy_detail);
      return super.success(res);
    } catch(e) {
      console.log('initNetwork-error==>', e);
      return super.failure(res);
    }
  }
  /**
   * 初始化socket
   */
  static async socketInitService(req, res) {
    try {
      const device_sn = req.body.sn;
      const device_pwd = req.body.device_pwd;
      const socket_address = req.body.socket_address;
      if(!socket_address || !device_sn) return super.failure(res);
      websocket(`ws://${socket_address}:5002`, {query: {sn: device_sn, password: device_pwd}});
      await Helper.backupFiles(CONFIG.SERVICE_CONFIG_PATH, CONFIG.SERVICE_CONFIG_NAME, CONFIG.SERVICE_CONFIG_BAK_NAME); //备份
      const service_file_ctx = (await Helper.readFiles(CONFIG.SERVICE_CONFIG_PATH, CONFIG.SERVICE_CONFIG_NAME)).toString(); //读取源文件
      await Helper.writeFiles(CONFIG.SERVICE_CONFIG_PATH, CONFIG.SERVICE_CONFIG_NAME, JSON.stringify(Object.assign(JSON.parse(service_file_ctx), {SOCKET: `ws://${socket_address}:5002`, DEVICE_PASSWORD: device_pwd}))); //写入新文件
      return super.success(res);
    } catch(e) {
      console.log('createSocketConnection-error==>', e);
      return super.failure(res);
    }
  }
  /**
   * 获取上网状态
   */
  static async interfaceWanStatusService(req, res) {
    try {
      const exec_res = await basicCommand.verifyNetwork();
      return super.success(res, {network_status: exec_res})
    } catch(e) {
      console.log('getNetworkStatus-error==>', e);
      return super.failure(res);
    }
  }
  /**
   * 获取socket链接状态
   */
  static async socketStatusService(req, res) {
    try {
      if(!global.socketConnectionStatus) return super.success(res, {socket_status: 0})
      return super.success(res, {socket_status: 1});
    } catch(e) {
      console.log('getSocketConnectionStatus-error==>', e);
      return super.failure(res)
    }
  }
  /**
   * 更新初始化状态
   */
  static async updateInitStatusService(req, res) {
    try {
      const { progress } = req.body;
      const serviceFileCtx = JSON.parse((await Helper.readFiles(CONFIG.SERVICE_CONFIG_PATH, CONFIG.SERVICE_CONFIG_NAME)).toString());
      serviceFileCtx.CONNECTED = req.body.progress;
      await Helper.writeFiles(CONFIG.SERVICE_CONFIG_PATH, CONFIG.SERVICE_CONFIG_NAME, JSON.stringify(serviceFileCtx));
      return super.success(res);
    } catch(e) {
      console.log('updateInitStatusService-error===>>', e);
      return super.failure(res);
    }

    
  }
  /**
   * 获取系统指标
   */
  static async systemTargetService(req, res) {
    try {
      const exec_res = await HttpService.__osTargetSyncService();
      return super.success(res, exec_res)
    } catch(e) {
      return super.failure();
    }
  }
  /**
   * 获取物理网卡指标
   */
  static async vmnicTargetService(req, res) {
    const exec_res = await HttpService.__vmnicTargetSyncService();
    return super.success(res, exec_res);
  }
  /**
   * 获取系统指标
   */
  static async __osTargetSyncService() {
    const socket_status = (!global.socketConnectionStatus) ? 0 : 1
    const [cpu, disk, memory, network_status] = await Promise.all([
      basicCommand.cpuFree(),
      basicCommand.diskFree(),
      basicCommand.memoryFree(),
      basicCommand.verifyNetwork()
    ])
    return {
      cpu, 
      disk, 
      memory, 
      network_status, 
      socket_status, 
      heart_beat: global.socketHeartBeat
    }
  }
  /**
   * 同步获取物理网卡指标
   */
  static async __vmnicTargetSyncService() {
    const vmnic_count = await basicCommand.vmnicCount();
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
    return data_array;
  }
  /**
   * 去中心读物理网卡信息
   */
  // static async __sendVmnicRequestService() {
  //   return new Promise((resolve, rejected) => {
  //     EmitEvent.emitDeviceInterfaceDeploy(global.socketConnection, {});
  //     global.socketConnection.once('wss:event:node:socket:device:interface:deploy:detail', (data) => {
  //       console.log('data====>>', data);
  //       resolve(data);
  //     })
  //     setTimeout(() => {
  //       rejected(new Error('等待响应超时'));
  //     }, 5000); // 5秒超时
  //   })
  // }

}
module.exports = HttpService;