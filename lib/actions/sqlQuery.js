/* eslint new-cap: [2, {"capIsNewExceptions": ["Q"]}] */
var Q = require('q');
var elasticio = require('elasticio-node');
var messages = elasticio.messages;
var utils = require('../utils.js');
var pg = require('pg');

module.exports.process = processAction;
module.exports.getMetaModel = getMetaModel;

/**
 * This method will be called from elastic.io platform providing following data
 *
 * @param msg incoming message object that contains ``body`` with payload
 * @param cfg configuration that is account information and configuration field values
 */
function processAction(msg, cfg) {
  var self = this;
  var conString = cfg.conString;
  var sql = cfg.query;
  console.log('Going to parse SQL sql=', sql);
  var result = utils.parseSQL(sql);
  console.log('Parsing result is ', result);
  console.log('Going to execute query sqlQuery=%s', result.query);
  var params = utils.createParametersArray(result.params, msg.body || {});
  console.log('Message transfomed into parameters, params=%j, body=%j', params, msg.body);

  pg.connect(conString, function(err, client, done) {
    // this initializes a connection pool
    // it will keep idle connections open for a (configurable) 30 seconds
    // and set a limit of 20 (also configurable)
    if(err) {
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
    var counter = 0;
    var q = client.query(result.query, params);
    q.on('row', function processRow(row) {
      var data = messages.newMessageWithBody(row);
      self.emit('data', data);
      counter++;
    });
    q.on('error', function(err) {
      console.error('Error when executing the query q=%s params=%j', result.query, params);
      done(client);
      counter = -1;
      self.emit('error', err);
      return self.emit('end');
    });
    q.on('end', function() {
      if (counter >= 0) {
        // In case we had an error before
        console.log('Fetched %s rows', counter);
        done();
        self.emit('end');
      }
    });
  });
}

/**
 * This function is called at design time when dynamic metadata need
 * to be fetched from 3rd party system
 *
 * @param cfg - configuration object same as in process method above
 * @param cb - callback returning metadata
 */
function getMetaModel(cfg, cb) {
  console.log('Fetching metadata with following configuration cfg=%j', cfg);
  // Here we return metadata in the same format as
  // it is configured in component.json
  var sql = cfg.query;
  var input = {}, output = {};
  console.log('Going to parse SQL sql=', sql);
  if (sql && sql.length > 0) {
    try {
      var result = utils.parseSQL(sql);
      console.log('Parsed SQL successfully', result);
      result.params.map((param) => {
        console.log('Appending new value to input', param);
        input[param.value] = {
          type : param.type,
          required: true
        };
      });
      result.fields.map((field) => {
        console.log('Appending new value to output', field);
        output[field.value] = {
          type: field.type,
          required: false
        };
      });
    } catch (error) {
      console.error('Exception happened, ', error);
      return cb(error);
    }
  }
  cb(null, {
    in: {
      type: "object",
      properties: input
    },
    out: {
      type: "object",
      properties: output
    }
  });
}
