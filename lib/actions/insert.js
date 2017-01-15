const messages = require('elasticio-node').messages;
const utils = require('../utils.js');
const pg = require('pg');

module.exports.process = processAction;

/**
 * This method will be called from elastic.io platform providing following data
 *
 * @param msg incoming message object that contains ``body`` with payload
 * @param cfg configuration that is account information and configuration field values
 */
function processAction(msg, cfg) {
    const self = this;
    const conString = cfg.conString;
    const sql = cfg.query;
    let script; // Cache variable for utils.prepareStatement
    console.log('Going to merge SQL template with msg sql="%s" body=%j', sql, msg.body);
    const q = utils.prepareStatement(sql, msg, script);
    pg.connect(conString, function(err, client, done) {
        // this initializes a connection pool
        // it will keep idle connections open for a (configurable) 30 seconds
        // and set a limit of 20 (also configurable)
        if (err) {
            console.error('error fetching client from pool', err);

            // An error occurred, remove the client from the connection pool.
            // A truthy value passed to done will remove the connection from the pool
            // instead of simply returning it to be reused.
            // In this case, if we have successfully received a client (truthy)
            // then it will be removed from the pool.
            done(client);
            self.emit('error', err);
            return self.emit('end');
        }
        console.log('Executing query q="%s" values=%j', q.text, q.values);
        const query = client.query(q, function(err, result) {
            if (err) {
                console.error('Error when executing the query q="%s" values=%j detail=%s', q.text, q.values, err.detail);
                done(client);
                self.emit('error', err);
                return self.emit('end');
            }
            console.log('Query successfully executed, pushing original message further');
            self.emit('data', msg);
            // End of the processing
            self.emit('end');
            // Return connection back to pool
            done();
        });
    });
}
