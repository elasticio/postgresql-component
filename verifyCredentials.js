var pg = require('pg');

// This function will be called by the platform to verify credentials
module.exports = function verifyCredentials(credentials, cb) {
    // In credentials you will find what users entered in account form
    console.log('Credentials passed for verification %j', credentials)
    var conString = credentials.conString;
    
    //this initializes a connection pool
    //it will keep idle connections open for a (configurable) 30 seconds
    //and set a limit of 20 (also configurable)
    pg.connect(conString, function (err, client, done) {
        if (err) {
            return console.error('error fetching client from pool', err);
        }
        client.query('SELECT $1::int AS number', ['1'], function (err, result) {
            //call `done()` to release the client back to the pool
            done();

            if (err) {
                console.error('error running query', err);
                return cb(err);
            }
            console.log("Verified ok, result=%s", result.rows[0].number);
            cb(null, { verified: true });
        });
    });
};