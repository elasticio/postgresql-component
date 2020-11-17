/* eslint-disable no-use-before-define,consistent-return,no-shadow,array-callback-return */
const Q = require('q');
const { messages } = require('elasticio-node');
const pg = require('pg');

const Cursor = require('pg-cursor');
const utils = require('../utils.js');

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
  } = cfg;
  const sql = cfg.query;
  this.logger.info('Going to parse SQL...: ');
  const result = utils.parseSQL(sql);
  this.logger.info('Result parsed');
  this.logger.info('Going to execute query sqlQuery...');
  const params = utils.createParametersArray(result.params, msg.body || {});
  this.logger.info('Message transformed into parameters');
  this.logger.info('Connecting to the database');
  const pool = new pg.Pool((conString) ? { connectionString: conString } : {
    host,
    port,
    database,
    user,
    password,
  });
  pool.connect((err, client, done) => {
    // this initializes a connection pool
    // it will keep idle connections open for a (configurable) 30 seconds
    // and set a limit of 20 (also configurable)
    if (err) {
      this.logger.error('Error occurred while fetching client from pool!');

      // An error occurred, remove the client from the connection pool.
      // A truthy value passed to done will remove the connection from the pool
      // instead of simply returning it to be reused.
      // In this case, if we have successfully received a client (truthy)
      // then it will be removed from the pool.
      done(client);
      self.emit('error', err);
      return self.emit('end');
    }
    const cursor = client.query(new Cursor(result.query, params));
    function loop(promise) {
      return promise.then(result => (result ? loop(nextBatchPromise(cursor, self)) : undefined));
    }
    loop(nextBatchPromise(cursor, self)).fail((err) => {
      this.logger.error('Error while executing the query!');
      done(client);
      self.emit('error', err);
      return self.emit('end');
    }).done(() => {
      self.emit('end');
      return done();
    });
  });
}

/**
 * Returns a promise that resolves into the next batch
 */
function nextBatchPromise(cursor, self) {
  const defer = Q.defer();
  this.logger.info('Fetching next 1000 rows');
  cursor.read(1000, (err, rows) => {
    if (err) {
      throw err;
    }
    // when the cursor is exhausted and all rows have been returned
    // all future calls to `cursor#read` will return an empty row array
    // so if we received no rows, release the client and be done
    if (!rows.length) {
      this.logger.info('No more rows');
      return defer.resolve(false);
    }
    rows.forEach(row => self.emit('data', messages.newMessageWithBody(row)));
    // Continue loop
    defer.resolve(true);
  });
  return defer.promise;
}

/**
 * This function is called at design time when dynamic metadata need
 * to be fetched from 3rd party system
 *
 * @param cfg - configuration object same as in process method above
 * @param cb - callback returning metadata
 */
function getMetaModel(cfg, cb) {
  this.logger.info('Fetching metadata...');
  // Here we return metadata in the same format as
  // it is configured in component.json
  const sql = cfg.query;
  const input = {};
  this.logger.info('Going to parse SQL...');
  if (sql && sql.length > 0) {
    try {
      const result = utils.parseSQL(sql);
      this.logger.info('SQL parsed successfully');
      result.params.map((param) => {
        this.logger.info('Appending new value to input');
        input[param.value] = {
          type: param.type,
          required: true,
        };
      });
    } catch (error) {
      this.logger.error('Exception occurred!');
      return cb(error);
    }
  }
  cb(null, {
    in: {
      type: 'object',
      properties: input,
    },
  });
}

module.exports.process = processAction;
module.exports.getMetaModel = getMetaModel;
