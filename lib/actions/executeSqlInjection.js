const elasticio = require('elasticio-node');

const { messages } = elasticio;

const utils = require('../utils.js');

/**
 * This method will be called from elastic.io platform providing following data
 *
 * @param msg incoming message object that contains ``body`` with payload
 * @param cfg configuration that is account information and configuration field values
 */
async function processAction(msg, cfg) {
  const self = this;
  const { sql } = msg.body;
  const values = {};

  try {
    const result = await utils.executeQuery(sql, values, cfg);
    self.emit('data', messages.newMessageWithBody({ result }));
  } catch (error) {
    self.emit('error', error);
  }
  self.emit('end');
}

module.exports.process = processAction;
