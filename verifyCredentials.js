const pg = require('pg');

// This function will be called by the platform to verify credentials
module.exports = function verifyCredentials(credentials, cb) {
  const {
    host,
    port,
    database,
    user,
    password,
    conString,
  } = credentials;

  const configuration = conString ? {
    connectionString: conString,
  } : {
    user,
    host,
    database,
    password,
    port,
  };

  const pool = new pg.Pool(configuration);

  pool.connect((err, client, done) => {
    if (err) {
      this.logger.error('error fetching client from pool', err);
      return cb(null, { verified: false });
    }
    client.query('SELECT $1::int AS number', ['1'], (error, res) => {
      done();
      if (error) {
        this.logger.error('error running query', error);
        return cb(null, { verified: false });
      }
      this.logger.info('Verified ok, result=%s', res.rows[0].number);
      return cb(null, { verified: true });
    });
  });
  pool.end();
};
