const pgp = require('pg-promise')({});

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
