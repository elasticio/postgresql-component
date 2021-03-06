let log;
const pgp = require('pg-promise')({
  connect() {
    log.info('Connected to specified database');
  },
  disconnect() {
    log.info('Disconnecting from database...');
  },
  transact(e) {
    if (e.ctx.finish) {
      if (e.ctx.success) {
        log.info('Transaction was executed successfully');
      } else {
        e.ctx.result.getErrors().forEach(() => {
          log.info('Transaction execution error found');
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
    allowSelfSignedCertificates,
  } = cfg;
  let connectionParameters;
  if (conString) {
    connectionParameters = {
      connectionString: conString,
    };
  } else {
    connectionParameters = {
      host,
      port,
      database,
      user,
      password,
    };
  }
  if (allowSelfSignedCertificates) {
    connectionParameters.ssl = {
      rejectUnauthorized: false,
    };
  }
  const db = pgp(connectionParameters);
  log.info('db successfully created');
  return db;
};

module.exports.detachDb = function detachDb(logger) {
  log = logger;
  pgp.end();
};
