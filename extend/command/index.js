const basicCommand = require('./basic');
const interfaceCommand = require('./interface');
const manetCommand = require('./manet');
const domainAccelerCommand = require('./domain-acceler');
const diagnoseCommand = require('./diagnose');
const natSwitchCommand = require('./nat-switch');
const firewallCommand = require('./firewall');

module.exports = {
  basicCommand, interfaceCommand, manetCommand, domainAccelerCommand, diagnoseCommand, natSwitchCommand, firewallCommand
}