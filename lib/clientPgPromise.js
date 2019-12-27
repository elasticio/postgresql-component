const pgp = require('pg-promise')({
  connect(client) {
    const cp = client.connectionParameters;
    this.logger.info('Connected to database:', cp.database);
  },
  disconnect(client) {
    const cp = client.connectionParameters;
    this.logger.info('Disconnecting from database:', cp.database);
  },
  transact(e) {
    if (e.ctx.finish) {
      if (e.ctx.success) {
        this.logger.info('Transaction was executed successfully');
      } else {
        e.ctx.result.getErrors().forEach((err) => {
          this.logger.info('Transaction execution error:\n', err.stack);
        });
        this.logger.info('Transaction was executed unsuccessfully');
        throw (e);
      }
    } else {
      this.logger.info('Transaction is starting... Start Time:', e.ctx.start);
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

module.exports.detachDb = function detachDb() {
  pgp.end();
};
