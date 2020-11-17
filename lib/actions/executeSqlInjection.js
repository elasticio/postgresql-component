const { messages } = require('elasticio-node');
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
    const result = await utils.executeQuery(this.logger, sql, values, cfg);
    await this.emit('data', messages.newMessageWithBody({ result }));
  } catch (error) {
    await this.emit('error', error);
  }
  await this.emit('end');
}

module.exports.process = processAction;
