const pgp = require('pg-promise')({});

/**
 * This method will be called from elastic.io platform providing following data
 *
 * @param msg incoming message object that contains ``body`` with payload
 * @param cfg configuration that is account information and configuration field values
 */
function processAction(msg, cfg) {
  const self = this;
  const conString = cfg.conString;
  const db = pgp(conString);
  const sql = cfg.query;
  const valuesArray = msg.body;

  db.tx(t => {
    const queries = valuesArray.map(l => {
      return t.none(sql, l);
    });
    return t.batch(queries);
  })
    .then(data => {
      console.log(`Query successfully executed, ${data.length} items is inserted, duration ${data.duration}, pushing original message...`);
      self.emit('data', msg);
      // End of the processing
      self.emit('end');
    })
    .catch(error => {
      console.log(`Error ${error}`);
      console.error(`Error when executing the query ${sql} detail: ${error.first.detail}'`);
      self.emit('error', error);
      return self.emit('end');
    });
}

module.exports.process = processAction;
