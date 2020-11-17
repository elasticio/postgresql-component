const { messages } = require('elasticio-node');

const utils = require('../utils.js');

/**
 * This method will be called from elastic.io platform providing following data
 *
 * @param msg incoming message object that contains ``body`` with payload
 * @param cfg configuration that is account information and configuration field values
 */
async function processAction(msg, cfg) {
  const { sql } = cfg;
  const values = msg.body;

  try {
    const result = await utils.executeQuery(this.logger, sql, values, cfg);
    this.emit('data', messages.newMessageWithBody({ result }));
  } catch (error) {
    this.emit('error', error);
  }
  this.emit('end');
}

/**
 * This function will be called to fetch metamodel for SQL query
 *
 * @param cfg
 * @param cb
 */
function getMetaModel(cfg, cb) {
  const VARS_REGEXP = /@([\w_$][\d\w_$]*(:(string|boolean|date|number|bigint|float|real|money))?)/g;
  const { sql } = cfg;
  const result = {
    in: {
      type: 'object',
      properties: {},
    },
  };
  if (sql && sql.length > 0) {
    const vars = sql.match(VARS_REGEXP);
    if (vars) {
      const fields = result.in.properties;
      // eslint-disable-next-line
      for (const tuple of vars) {
        const [key, type] = tuple.split(':');
        let jsType = 'string';
        // eslint-disable-next-line
        switch (type) {
          case 'date':
            jsType = 'string';
            break;
          case 'bigint':
            jsType = 'number';
            break;
          case 'real':
            jsType = 'number';
            break;
          case 'float':
            jsType = 'number';
            break;
          case 'money':
            jsType = 'number';
            break;
          case 'boolean':
            jsType = 'boolean';
            break;
          case 'number':
            jsType = 'number';
            break;
        }
        fields[key.substr(1)] = {
          type: jsType,
        };
      }
    }
  }
  cb(null, result);
}

module.exports.getMetaModel = getMetaModel;
module.exports.process = processAction;
