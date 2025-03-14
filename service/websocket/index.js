const io = require('socket.io-client');
const mapEvent = require('./map-event')

module.exports = (socketAddress, condition) => {
  if(global.socketConnection) {
    if(socketAddress == global.socketConnection.io.uri) return;
    global.socketConnection.disconnect();
  }
  condition = Object.assign(condition, {
    pingInterval: 25000,  // 每 25 秒发送一次 ping
    pingTimeout: 10000,   // 如果 10 秒内没有响应 pong，则认为超时
    reconnection: true, 
    reconnectionDelay: 5000,
    reconnectionAttempts: 5,  // 最多尝试 5 次重连
  })
  global.socketConnection = io(socketAddress, condition);
  Object.keys(mapEvent).forEach(key => mapEvent[key](global.socketConnection))
  return;  
}