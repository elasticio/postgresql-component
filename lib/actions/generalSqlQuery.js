const { messages } = require('elasticio-node');
const { Pool } = require('pg');

const utils = require('../utils.js');

const VARS_REGEXP = /@([\w_$][\d\w_$]*(:(string|boolean|date|number|bigint|float|real|money))?)/g;

/**
 * This method will be called from elastic.io platform providing following data
 *
 * @param msg incoming message object that contains ``body`` with payload
 * @param cfg configuration that is account information and configuration field values
 */
async function process(msg, cfg) {
  const { sql } = cfg;
  const connectionString = cfg.conString;
  const { body } = msg;

  try {
    const pool = new Pool({ connectionString });
    const client = await pool.connect();

    const query = utils.prepareQuery(sql, body);
    const res = await client.query(query);

    client.release();
    console.log(`Result.rows: ${JSON.stringify(res.rows)}`);
    await pool.end();
    this.emit('data', messages.newMessageWithBody(res.rows));
  } catch (e) {
    console.error(`Error: ${JSON.stringify(e)}`);
    this.emit('error', e);
  }
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
module.exports.process = process;
