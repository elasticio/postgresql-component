const pg = require('pg');

// This function will be called by the platform to verify credentials
module.exports = function verifyCredentials(credentials, cb) {
  const connectionString = credentials.conString;

  const pool = new pg.Pool({ connectionString });

  pool.connect((err, client, done) => {
    if (err) {
      console.error('error fetching client from pool', err);
      return cb(null, { verified: false });
    }
    client.query('SELECT $1::int AS number', ['1'], (error, res) => {
      done();
      if (error) {
        console.error('error running query', error);
        return cb(null, { verified: false });
      }
      console.log('Verified ok, result=%s', res.rows[0].number);
      return cb(null, { verified: true });
    });
  });
  pool.end();
};
