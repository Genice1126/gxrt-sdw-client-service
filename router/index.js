const express = require('express');
const router = express.Router();
const HttpService = require('../service/index');

//登录
router.post('/login', HttpService.loginService);
//修改密码
router.post('/password', HttpService.updatePwdService);
//初始化上网配置
router.post('/network', HttpService.interfaceWanInitService);
//获取上网状态
router.post('/networkStatus', HttpService.interfaceWanStatusService);
//创建socket链接
router.post('/socket', HttpService.socketInitService);
//获取socket链接状态
router.post('/socketStatus', HttpService.socketStatusService);
//变更初始换进度
router.post('/progress', HttpService.updateInitStatusService);
//获取系统指标
router.post('/system', HttpService.systemTargetService);
//获取物理网卡信息
router.post('/vmnic', HttpService.vmnicTargetService);

module.exports = router;