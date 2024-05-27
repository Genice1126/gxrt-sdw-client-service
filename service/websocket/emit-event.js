
exports.emitOsTargetSyncSocket = (client, payload) => {
  return client.emit(`wss:event:socket:node:os:target`, payload);
}
exports.emitVmnicTargetSyncSocket = (client, payload) => {
  return client.emit(`wss:event:socket:node:vmnic:target`, payload);
}
exports.emitHeartBeatSocket = (client, payload) => {
  return client.emit(`wss:event:socket:node:heart:beat`, payload);
}