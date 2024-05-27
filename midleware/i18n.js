const path = require('path');
const i18n = require('i18n');

i18n.configure({
  locales: ['en', 'zh'],
  directory: path.join(__dirname, '../extend/lang'),
  queryParameter: 'x-lang',
  defaultLocale: 'zh'
})

module.exports = i18n;