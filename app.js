global.socketConnection;
global.socketConnectionStatus;  //0不在线  1在线
global.socketHeartBeat;  //心跳时延
const express = require('express');
const app = express();
const router = require('./router/index');
const initMid = require('./middleware/index');
const CONFIG = require('./config/index');
const Helper = require('./extend/helper');
const {basicCommand} = require('./extend/command/index');
const websocket = require('./service/websocket');

initMid(app);
app.use(router);

app.listen(CONFIG.LISTEN_PORT, async () => { 
  const deviceSerial = await basicCommand.readDeviceSerial() || "ABC";
  const serviceFileExists = await Helper.existsFiles(CONFIG.SERVICE_CONFIG_PATH, CONFIG.SERVICE_CONFIG_NAME);
  if(!serviceFileExists) await Helper.writeFiles(CONFIG.SERVICE_CONFIG_PATH, CONFIG.SERVICE_CONFIG_NAME, JSON.stringify(Object.assign(CONFIG.SERVICE_INIT_DATA, {SERIAL: deviceSerial})));
  const serviceFileCtx = JSON.parse((await Helper.readFiles(CONFIG.SERVICE_CONFIG_PATH, CONFIG.SERVICE_CONFIG_NAME)).toString());
  if(serviceFileCtx.CONNECTED == 3) websocket(serviceFileCtx.SOCKET, {query: {sn: serviceFileCtx.SERIAL, password: serviceFileCtx.DEVICE_PASSWORD}})
  console.log(`Client Service is Beginning... , Listening: ${CONFIG.LISTEN_PORT}, 本设备序列号: ${deviceSerial || "未知"}`) 
});