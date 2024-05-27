const express = require('express');
const corsMid = require('./cors');
const callRes = require('./callResTime');
const handleError = require('./handleError');
const i18n = require('./i18n');

module.exports = (app) => {
  app.use(corsMid);
  app.use(callRes());
  app.use(i18n.init);
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));
  app.use(handleError);
}