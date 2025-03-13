const io = require('socket.io-client');
const mapEvent = require('./map-event')

module.exports = (socketAddress, condition) => {
  if(global.socketConnection) {
    if(socketAddress == global.socketConnection.io.uri) return;
    global.socketConnection.disconnect();
  }
  condition = Object.assign(condition, {
    transports: ['websocket'],
    reconnection: true, 
    reconnectionDelay: 5000,
  })
  global.socketConnection = io(socketAddress, condition);
  Object.keys(mapEvent).forEach(key => mapEvent[key](global.socketConnection))
  return;  
}