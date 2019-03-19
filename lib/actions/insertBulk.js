const pgp = require('pg-promise')({});
const elasticio = require('elasticio-node');

const { messages } = elasticio;
const clientPgPromise = require('../clientPgPromise.js');
const utils = require('../utils.js');

/**
 * This method will be called from elastic.io platform providing following data
 *
 * @param msg incoming message object that contains ``body`` with payload
 * @param cfg configuration that is account information and configuration field values
 */
async function processAction(msg, cfg) {
  const self = this;
  const { columns, tableName } = cfg;
  const { values } = msg.body;

  if (Array.isArray(values)) {
    const newColumns = columns.replace(/(\r\n|\n|\r)/gm, ' ') // remove newlines
      .replace(/\s+/g, ' ') // excess white space
      .split(',') // split into all statements
      .map(Function.prototype.call, String.prototype.trim);

    const tableNameOption = utils.getTableNameOption(tableName);

    const cs = new pgp.helpers.ColumnSet(newColumns, tableNameOption);
    const queryInsert = pgp.helpers.insert(values, cs);

    const db = clientPgPromise.getDb(cfg);
    await db.none(queryInsert)
      .then(() => {
        console.log('Query successfully executed, emitting result ...');
        self.emit('data', messages.newMessageWithBody({ result: 'Ok' }));
        self.emit('end');
      })
      .catch((error) => {
        console.error(`Error when executing the query  detail: ${error}'`);
        self.emit('error', error);
        return self.emit('end');
      });
    db.$pool.end();
  } else {
    self.emit('error', new Error('Values is not an array'));
    self.emit('end');
  }
}

module.exports.process = processAction;
