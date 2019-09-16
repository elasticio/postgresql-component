/* eslint-disable consistent-return */
/* eslint-disable no-console */

const { messages } = require('elasticio-node');
const utils = require('../utils.js');
const clientPgPromise = require('../clientPgPromise.js');

/**
 * This method will be called from elastic.io platform providing following data
 *
 * @param msg incoming message object that contains ``body`` with payload
 * @param cfg configuration that is account information and configuration field values
 */
async function processAction(msg, cfg) {
  const self = this;
  const sql = cfg.query;
  const script = null; // Cache variable for utils.prepareStatement
  const values = msg.body;
  console.log('Going to merge SQL template with msg sql="%s" body=%j', sql, values);
  const q = utils.prepareStatement(sql, msg, script);

  const db = clientPgPromise.getDb(cfg);
  await db.result(q.text, q.values)
    .then(async (result) => {
      if (result.rowCount === 0) {
        console.error('Error: Result from executing the query q="%s" values=%j resulted in 0 rows changed.', q.text, q.values);
        throw new Error('see above');
      }
      console.log('Query successfully executed, pushing original message further command=%s affectedRows=%s',
        result.command, result.rowCount);
      await self.emit('data', messages.newMessageWithBody(msg));
    })
    .catch(async (error) => {
      console.error(`Error when executing the query  detail: ${error}'`);
      await self.emit('error', error);
    });
  db.$pool.end();


  // pg.connect(conString, (conErr, client, done) => {
  //   // this initializes a connection pool
  //   // it will keep idle connections open for a (configurable) 30 seconds
  //   // and set a limit of 20 (also configurable)
  //   if (conErr) {
  //     console.error('error fetching client from pool', conErr);

  //     // An error occurred, remove the client from the connection pool.
  //     // A truthy value passed to done will remove the connection from the pool
  //     // instead of simply returning it to be reused.
  //     // In this case, if we have successfully received a client (truthy)
  //     // then it will be removed from the pool.
  //     done(client);
  //     this.emit('error', conErr);
  //     return this.emit('end');
  //   }
  //   console.log('Executing query q="%s" values=%j', q.text, q.values);
  //   client.query(q, (err, result) => {
  //     if (err) {
  //       console.error('Error when executing the query q="%s" values=%j detail=%s', q.text, q.values, err.detail);
  //       done(client);
  //       this.emit('error', err);
  //       return this.emit('end');
  //     }

  //     if (result.rowCount === 0) {
  //       console.error('Error: Result from executing the query q="%s" values=%j resulted in 0 rows changed.', q.text, q.values);
  //       done(client);
  //       return this.emit('end');
  //     }

  //     console.log('Query successfully executed, pushing original message further command=%s affectedRows=%s',
  //       result.command, result.rowCount);
  //     this.emit('data', msg);
  //     // End of the processing
  //     this.emit('end');
  //     // Return connection back to pool
  //     done();
  //   });
  // });
  // pg.end();
}

module.exports.process = processAction;
