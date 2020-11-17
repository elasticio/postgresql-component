let log;
const pgp = require('pg-promise')({
  connect(client) {
    const cp = client.connectionParameters;
    log.info('Connected to database:', cp.database);
  },
  disconnect(client) {
    const cp = client.connectionParameters;
    log.info('Disconnecting from database:', cp.database);
  },
  transact(e) {
    if (e.ctx.finish) {
      if (e.ctx.success) {
        log.info('Transaction was executed successfully');
      } else {
        e.ctx.result.getErrors().forEach((err) => {
          log.info('Transaction execution error:\n', err.stack);
        });
        log.info('Transaction was executed unsuccessfully');
        throw (e);
      }
    } else {
      log.info('Transaction is starting... Start Time:', e.ctx.start);
    }
  },
});

/**
 * This is PG-promise client
 *
 * @param cfg configuration that contains conString parameter
 * @param logger to use
 */
module.exports.getDb = function getDb(cfg, logger) {
  log = logger;
  const {
    host,
    port,
    database,
    user,
    password,
    conString,
  } = cfg;
  const db = pgp(conString || {
    host,
    port,
    database,
    user,
    password,
  });
  return db;
};

module.exports.detachDb = function detachDb(logger) {
  log = logger;
  pgp.end();
};
