const pgp = require('pg-promise')({
  connect(client) {
    const cp = client.connectionParameters;
    console.log('Connected to database:', cp.database);
  },
  disconnect(client) {
    const cp = client.connectionParameters;
    console.log('Disconnecting from database:', cp.database);
  },
  transact(e) {
    if (e.ctx.finish) {
      if (e.ctx.success) {
        console.log('Transaction was executed successfully');
      } else {
        e.ctx.result.getErrors().forEach((err) => {
          console.log('Transaction execution error', err.stack);
        });
        console.log('Transaction was executed unsuccessfully');
        throw (e);
      }
    } else {
      console.log('Transaction is starting... Start Time:', e.ctx.start);
    }
  },
});

/**
 * This is PG-promise client
 *
 * @param cfg configuration that contains conString parameter
 */
module.exports.getDb = function getDb(cfg) {
  const { conString } = cfg;
  const db = pgp(conString);
  return db;
};
