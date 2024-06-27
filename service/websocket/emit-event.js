
exports.emitOsTargetSyncSocket = (client, payload) => {
  console.log(`emitOsTargetSyncSocket === payload : ${JSON.stringify(payload)}`)
  return client.emit(`wss:event:socket:node:os:target`, payload);
}
exports.emitVmnicTargetSyncSocket = (client, payload) => {
  console.log(`emitVmnicTargetSyncSocket === payload : ${JSON.stringify(payload)}`)
  return client.emit(`wss:event:socket:node:vmnic:target`, payload);
}
exports.emitHeartBeatSocket = (client, payload) => {
  console.log(`emitHeartBeatSocket === payload : ${JSON.stringify(payload)}`)
  return client.emit(`wss:event:socket:node:heart:beat`, payload);
}
exports.emitDiagnoseResult = (client, payload) => {
  console.log(`emitDiagnoseResult === payload : ${JSON.stringify(payload)}`)
  return client.emit(`wss:event:socket:node:diagnose:result`, payload);
}
exports.emitInterfaceFlow = (client, payload) => {
  console.log(`emitInterfaceFlow === payload : ${JSON.stringify(payload)}`)
  return client.emit(`wss:event:socket:node:interface:flow`, payload);
}
exports.emitManetInterfaceDelay = (client, payload) => {
  console.log(`emitManetInterfaceDelay === payload : ${JSON.stringify(payload)}`)
  return client.emit(`wss:event:socket:node:manet:interface:delay`, payload);
}