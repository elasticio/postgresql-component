const elasticio = require('elasticio-node');

const { messages } = elasticio;

const utils = require('../utils.js');
const clientPgPromise = require('../clientPgPromise.js');

const VARS_REGEXP = /@([\w_$][\d\w_$]*(:(string|boolean|date|number|bigint|float|real|money))?)/g;

/**
 * This method will be called from elastic.io platform providing following data
 *
 * @param msg incoming message object that contains ``body`` with payload
 * @param cfg configuration that is account information and configuration field values
 */
async function processAction(msg, cfg) {
  const self = this;
  const { sql } = cfg;
  const { body } = msg;

  const queries = utils.prepareQueries(sql, body);

  const db = clientPgPromise.getDb(cfg);
  await db.tx((t) => {
    const preparedQueries = [];
    queries.forEach((query) => {
      preparedQueries.push(t.any(query));
    });
    return t.batch(preparedQueries);
  })
    .then((data) => {
      console.log(`Query successfully executed, Data ${JSON.stringify(data)}`);
      self.emit('data', messages.newMessageWithBody(data));
    })
    .catch((error) => {
      const errMsg = `Error when executing the query ${queries} detail: ${error.first.detail}'`;
      console.error(errMsg);
      self.emit('error', error);
    });
}

/**
 * This function will be called to fetch metamodel for SQL query
 *
 * @param cfg
 * @param cb
 */
function getMetaModel(cfg, cb) {
  const { sql } = cfg;
  const result = {
    in: {
      type: 'object',
      properties: {},
    },
    out: {},
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
