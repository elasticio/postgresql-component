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

  // eslint-disable-next-line consistent-return
  pool.connect((err, client, done) => {
    if (err) {
      this.logger.error('Error occurred while fetching client from pool!');
      return cb(null, { verified: false });
    }
    // eslint-disable-next-line no-unused-vars
    client.query('SELECT $1::int AS number', ['1'], (error, res) => {
      done();
      if (error) {
        this.logger.error('Error while running query!');
        return cb(null, { verified: false });
      }
      this.logger.info('Credentials verified');
      return cb(null, { verified: true });
    });
  });
  pool.end();
};
