/* eslint new-cap: [2, {"capIsNewExceptions": ["Q"]}] */
const Q = require('q');
const elasticio = require('elasticio-node');
const messages = elasticio.messages;
const utils = require('../utils.js');
const pg = require('pg');
const Cursor = require('pg-cursor');

const ROWS_BATCH_SIZE = 1000;
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
    const isBatch = cfg.batch || false;
    let script = null; // Cache variable for utils.prepareStatement
    console.log('Going to merge SQL template with msg sql="%s" body=%j', sql, msg.body);
    const q = utils.prepareStatement(sql, msg, script);
    console.log('Going to execute query sqlQuery=%s values=%j', q.text, q.values);
    console.log('Connecting to the database');
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
        const cursor = client.query(new Cursor(q.text, q.values));
        function loop(promise) {
            return promise.then((result) => {
                return result ? loop(nextBatchPromise(cursor, self, isBatch)) : undefined;
            });
        }
        loop(nextBatchPromise(cursor, self, isBatch)).fail((err) => {
            console.error('Error when executing the query q=%s values=%j', q.text, q.values);
            done(client);
            self.emit('error', err);
            return self.emit('end');
        }).done(function() {
            console.log('Query done');
            self.emit('end');
            return done();
        });
    });
}

module.exports.process = processAction;

/**
 * Returns a promise that resolves into the next batch
 * @param custor pg-cursor query
 * @param self for emitting
 * @param sendAsArray when true array with up to 1000 rows will be emitted, otherwise each row will be emitted
 *          separately
 */
function nextBatchPromise(cursor, self, sendAsArray) {
    const defer = Q.defer();
    console.log('Fetching next batch of rows size=%s', ROWS_BATCH_SIZE);
    cursor.read(ROWS_BATCH_SIZE, function processRows(err, rows) {
        if (err) {
            throw err;
        }
        if (!rows.length) {
            //when the cursor is exhausted and all rows have been returned
            //all future calls to `cursor#read` will return an empty row array
            //so if we received no rows, release the client and be done
            if (sendAsArray) {
                // We will emit an empty array
                self.emit('data', messages.newMessageWithBody({ values: [] }));
            }
            console.log('All rows fetched, last batch size was size=0');
            return defer.resolve(false);
        }
        if (sendAsArray) {
            self.emit('data', messages.newMessageWithBody({ values: rows }));
        } else {
            rows.forEach((row) => self.emit('data', messages.newMessageWithBody(row)));
        }
        if (rows.length < ROWS_BATCH_SIZE) {
            console.log('All rows were fetched, last batch size was size=', rows.length);
            return defer.resolve(false);
        }
        // Continue loop
        defer.resolve(true);
    });
    return defer.promise;
}
