const { messages } = require('elasticio-node');
const utils = require('../utils.js');
const clientPgPromise = require('../clientPgPromise.js');

/**
 * This method will be called from elastic.io platform providing following data
 *
 * @param msg incoming message object that contains ``body`` with payload
 * @param cfg configuration that is account information and configuration field values
 */
async function processAction(msg, cfg) {
  const self = this;
  const sql = cfg.query;
  const script = null; // Cache variable for utils.prepareStatement
  const q = utils.prepareStatement(sql, msg, script);

  const db = clientPgPromise.getDb(cfg);
  try {
    const result = await db.result(q.text, q.values);
    if (result.rowCount === 0) {
      // considered an unsuccessful query
      const err = `Result from executing the query q=${q.text} values=${q.values} resulted in 0 rows changed.`;
      throw new Error(err);
    }
    // successful query
    db.$pool.end();
    return messages.newMessageWithBody(msg.body);
  } catch (error) {
    // unsucessful query
    await self.emit('error', error);
  }
  db.$pool.end();
}

module.exports.process = processAction;
