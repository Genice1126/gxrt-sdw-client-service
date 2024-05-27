
const dev = require('./dev');
const prod = require('./prod');

const map = new Map();
map.set('dev', dev);
map.set('prod', prod);

const cfg = map.get(process.env.NODE_ENV || 'dev');
module.exports = cfg;
