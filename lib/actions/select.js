/* eslint-disable consistent-return */
const Q = require('q');
const { messages } = require('elasticio-node');
const pg = require('pg');
const Cursor = require('pg-cursor');
const utils = require('../utils.js');

const ROWS_BATCH_SIZE = 1000;
/**
 * Returns a promise that resolves into the next batch
 * @param cursor pg-cursor query
 * @param self for emitting
 * @param sendAsArray when true array with up to 1000 rows will be emitted, otherwise each
 * row will be emitted separately
 */
function nextBatchPromise(cursor, self, sendAsArray) {
  const defer = Q.defer();
  self.logger.info('Fetching next batch of rows size=%s', ROWS_BATCH_SIZE);
  cursor.read(ROWS_BATCH_SIZE, async (err, rows) => {
    if (err) {
      throw err;
    }
    if (!rows.length) {
      // when the cursor is exhausted and all rows have been returned
      // all future calls to `cursor#read` will return an empty row array
      // so if we received no rows, release the client and be done
      if (sendAsArray) {
        // We will emit an empty array
        await self.emit('data', messages.newMessageWithBody({ values: [] }));
      }
      self.logger.info('All rows fetched, last batch size was size=0');
      return defer.resolve(false);
    }
    if (sendAsArray) {
      await self.emit('data', messages.newMessageWithBody({ values: rows }));
    } else {
      // eslint-disable-next-line no-restricted-syntax
      for (const row of rows) {
        // eslint-disable-next-line no-await-in-loop
        await self.emit('data', messages.newMessageWithBody(row));
      }
    }
    if (rows.length < ROWS_BATCH_SIZE) {
      self.logger.info('All rows were fetched, last batch size was size=%s', rows.length);
      return defer.resolve(false);
    }
    // Continue loop
    defer.resolve(true);
  });
  return defer.promise;
}

/**
 * This method will be called from elastic.io platform providing following data
 *
 * @param msg incoming message object that contains ``body`` with payload
 * @param cfg configuration that is account information and configuration field values
 */
function processAction(msg, cfg) {
  const self = this;
  const {
    host,
    port,
    database,
    user,
    password,
    conString,
    allowSelfSignedCertificates,
  } = cfg;
  const sql = cfg.query;
  const isBatch = cfg.batch || false;
  const script = null; // Cache variable for utils.prepareStatement
  self.logger.info('Going to merge SQL template');
  const q = utils.prepareStatement(sql, msg, script);
  self.logger.info('Going to execute query');
  self.logger.info('Connecting to the database');
  const options = (conString) ? { connectionString: conString } : {
    host,
    port,
    database,
    user,
    password,
  };
  if (allowSelfSignedCertificates) {
    options.ssl = {
      rejectUnauthorized: false,
    };
  }
  const pool = new pg.Pool(options);
  pool.connect((err, client, done) => {
    // this initializes a connection pool
    // it will keep idle connections open for a (configurable) 30 seconds
    // and set a limit of 20 (also configurable)
    if (err) {
      self.logger.error('Error fetching client from pool occurred');

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
      return promise.then(
        (result) => (result ? loop(nextBatchPromise(cursor, self, isBatch)) : undefined),
      );
    }

    loop(nextBatchPromise(cursor, self, isBatch))
      .fail((error) => {
        self.logger.error('Error when executing the query');
        done(client);
        self.emit('error', error);
        return self.emit('end');
      })
      .done(() => {
        self.logger.info('Query done');
        self.emit('end');
        return done();
      });
  });
}

module.exports.process = processAction;
