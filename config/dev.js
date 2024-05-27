const path = require('path');

module.exports = {

  LISTEN_PORT: 3000,
  
  SERVICE_INIT_DATA: {
    CONNECTED: 0,  //0第一次登录 1修改密码完成 2上网配置完成 3socket配置完成
    ACCOUNT: "admin",
    PASSWORD: "admin",
    SOCKET: "ws://192.168.39.24:5002"
  },

  SERVICE_CONFIG_PATH: "/root/gxrt-sdw/gxrt-sdw-client-service",
  SERVICE_CONFIG_NAME: "service.conf",
  SERVICE_CONFIG_BAK_NAME: "service.conf.bak",

  SYSTEM_XXX_CONFIG_PATH:"",
  SYSTEM_XXX_CONFIG_NAME:"",
  SYSTEM_XXX_CONFIG_BAK_NAME:"",

  SYSTEM_YYY_CONFIG_PATH:"",
  SYSTEM_YYY_CONFIG_NAME:"",
  SYSTEM_YYY_CONFIG_BAK_NAME:"",

  SYSTEM_ZZZ_CONFIG_PATH:"",
  SYSTEM_ZZZ_CONFIG_NAME:"",
  SYSTEM_ZZZ_CONFIG_BAK_NAME:"",

}