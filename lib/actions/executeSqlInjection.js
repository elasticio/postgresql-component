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
  const { sql } = msg.body;
  const values = {};

  try {
    const result = await utils.executeQuery(sql, values, cfg);
    console.log(`result ${JSON.stringify(result)}`);
    this.emit('data', messages.newMessageWithBody(result));
  } catch (error) {
    console.error(error);
    this.emit('error', error);
  }
}

module.exports.process = processAction;
