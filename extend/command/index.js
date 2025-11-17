const basicCommand = require('./basic');
const interfaceCommand = require('./interface');
const manetCommand = require('./manet');
const domainAccelerCommand = require('./domain-acceler');
const diagnoseCommand = require('./diagnose');
const natSwitchCommand = require('./nat-switch');
const firewallCommand = require('./firewall');
const routerStrategyCommand = require('./router-strategy');
const ipsecCommand = require('./ipsec');
const cloudProxyCommand = require('./cloudProxy');

module.exports = {
  basicCommand, interfaceCommand, manetCommand, domainAccelerCommand, diagnoseCommand, natSwitchCommand, firewallCommand, routerStrategyCommand,ipsecCommand, cloudProxyCommand
}