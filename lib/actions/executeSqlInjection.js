const elasticio = require('elasticio-node');

const { messages } = elasticio;

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
  const { sql } = msg.body;

  const queries = utils.prepareQueries(sql, {});

  const db = clientPgPromise.getDb(cfg);
  await db.tx((t) => {
    const preparedQueries = [];
    queries.forEach((query) => {
      preparedQueries.push(t.any(query));
    });
    return t.batch(preparedQueries);
  })
    .then((data) => {
      console.log(`Query successfully executed, Data ${JSON.stringify(data)}`);
      self.emit('data', messages.newMessageWithBody(data));
    })
    .catch((error) => {
      const errMsg = `Error when executing the query ${queries} detail: ${error.first.detail}'`;
      console.error(errMsg);
      self.emit('error', error);
    });
}

module.exports.process = processAction;
