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
  

  function emitData() {
    //this initializes a connection pool
    //it will keep idle connections open for a (configurable) 30 seconds
    //and set a limit of 20 (also configurable)
    pg.connect(conString, function(err, client, done) {
      if(err) {
        console.error('error fetching client from pool', err);
        throw new Error('error fetching client from pool', err);
      }
      client.query('SELECT $1::int AS number', ['1'], function(err, result) {
        //call `done()` to release the client back to the pool
        done();

        if(err) {
          return console.error('error running query', err);
        }
        console.log(result.rows[0].number);
        //output: 1
      });
    });
    console.log('About to say hello to ' + name + ' again');

    var body = {
      greeting: name + ' How are you today?',
      originalGreeting: msg.body.greeting
    };

    var data = messages.newMessageWithBody(body);

    self.emit('data', data);
  }

  function emitError(e) {
    console.log('Oops! Error occurred');

    self.emit('error', e);
  }

  function emitEnd() {
    console.log('Finished execution');

    self.emit('end');
  }

  Q().then(emitData).fail(emitError).done(emitEnd);
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
