/* eslint-disable no-param-reassign, max-len, prefer-destructuring */
const sqlParser = require('sql-parser');

const { parser } = sqlParser;
const { lexer } = sqlParser;
const { nodes } = sqlParser;
const { ParameterValue } = sqlParser.nodes;
const { Op } = sqlParser.nodes;
const _ = require('lodash');
const SQL = require('sql-template-strings');
const util = require('util');
const vm = require('vm');

const clientPgPromise = require('./clientPgPromise.js');


const VARS_REGEXP = /@([\w_$][\d\w_$]*(:(string|boolean|date|number|bigint|float|real|money))?)/g;

/**
 * This method returns an array of parameters created based on ordered array of parameter objects
 * {type,value} and source values
 *
 * @param params
 * @param source
 */
module.exports.createParametersArray = function createParametersArray(params, source) {
  return params.map((param) => {
    const value = source[param.value];
    if (param.type === 'number') {
      return Number(value);
    } if (param.type === 'float') {
      return Number.parseFloat(value);
    } if (param.type === 'boolean') {
      return value === true || value === 'true';
    }
    return value;
  });
};

/**
 * This function will return a query
 *
 * @param template a query template like `INSERT INTO books VALUES (${name},${author},${price})`
 * @param msg elastic.io message that has ``body``
 * @param script an optional variable you could store outside of the context of this function
 *          will be used for caching reusable artifact
 */
module.exports.prepareStatement = function prepareStatement(template, msg, script) {
  const context = Object.assign(msg.body || {}, {
    SQL,
  });
  if (!script) {
    script = new vm.Script(util.format('__eio_eval_result = SQL`%s`', template));
  }
  script.runInContext(vm.createContext(context));
  // eslint-disable-next-line
  const result = context.__eio_eval_result;
  result.name = `eio-query-${process.env.ELASTICIO_TASK_ID}`;
  return result;
};

/**
 * Prepare parameters for later usage
 *
 * @param object
 */
function extractType(object) {
  const values = object.value.split(':');
  if (values.length > 1) {
    object.type = values[1];
    object.value = values[0];
  } else {
    object.type = 'string'; // Default type
  }
  return object.type;
}

function transformParameter(param, index) {
  extractType(param);
  const result = {
    value: param.value,
    type: param.type,
  };
  param.value = `$${index + 1}`;
  return result;
}

/**
 * Prepare fields for later use
 */
function transformFields(field) {
  let result = {};
  if (field.field instanceof nodes.LiteralValue && field.field.nested === false && field.field.value) {
    result.type = extractType(field.field);
    result.value = field.field.value;
    if (field.name && field.name instanceof nodes.LiteralValue && field.name.nested === false && field.name.value) {
      // Name has should overwrite settings on field if name is defined
      result.type = extractType(field.name);
      result.value = field.name.value;
    }
  } else if (field instanceof nodes.Star) {
    // We have a 'select *' type of query
    result = undefined;
  } else {
    console.error(`Can not transform field ${field}`);
    throw new Error(`Can not process field ${field}`);
  }
  return result;
}

/**
 * Recursive function to collect operators from Op node
 *
 * @param op operator
 * @param result resulting array
 */
function collectParameters(op, result) {
  if (!result) {
    result = [];
  }
  if (!op || !(op instanceof Op)) return;
  if (op.left && op.left instanceof ParameterValue) {
    result.push(op.left);
  } else if (op.left instanceof Op) {
    collectParameters(op.left, result);
  }
  if (op.right && op.right instanceof ParameterValue) {
    result.push(op.right);
  } else if (op.right instanceof Op) {
    collectParameters(op.right, result);
  }
  // eslint-disable-next-line
  return result;
}

/**
 * This function parses SQL into a usable form.
 * It's a sync function and in case of errors it will throw an exception
 *
 * @param sqlQuery
 */
module.exports.parseSQL = function parseSQL(sqlQuery) {
  const tokens = lexer.tokenize(sqlQuery);
  const stmt = parser.parse(tokens);
  let params = []; let
    fields = [];
  if (stmt instanceof nodes.Select) {
    if (stmt.where) {
      // Process parameters
      params = collectParameters(stmt.where.conditions);
      // Sort alphabetically
      params = _.sortBy(params, 'value');
      // Transform values
      params = params.map(transformParameter);
    }
    // Process fields
    fields = stmt.fields.map(transformFields).filter(a => !!a);
  } else {
    throw new Error('Only SELECT statements are supported right now');
  }
  // Patch the toString function to make sure no ` is rendered
  nodes.LiteralValue.prototype.toString = function () {
    return (this.values.join('.'));
  };
  return {
    stmt,
    params,
    fields,
    query: stmt.toString(),
  };
};

/**
 * This function prepare SQL Parameterized Query if query contains vars
 *
 * @param sql - query string
 * @param body - values to prepare  Parameterized Query
 * @return query - prepared sql string
 */
function prepareQuery(sql, body) {
  console.log('Received SQL query = %s', sql);
  const regExpWhiteList = /^(?!.*(?:DROP |ALTER )).*$/si;
  const result = regExpWhiteList.test(sql);
  if (!result) {
    const errMessage = 'DROP and ALTER commands are not allowed to execute';
    throw new Error(errMessage);
  }
  const vars = sql.match(VARS_REGEXP);
  let query;
  if (vars) {
    console.log('Found following prepared variable:type pairs=%j', vars);
    const values = [];
    let text = sql;
    // eslint-disable-next-line
    for (let i = 0; i < vars.length; i++) {
      const tuple = vars[i];
      const [placeholder] = tuple.split(':');
      const name = placeholder.substr(1);
      text = text.replace(tuple, `$${i + 1}`);
      values.push(body[`${name}`]);
    }
    query = {
      text,
      values,
    };
  } else {
    query = sql;
  }
  console.log('Preparing statement created. Resulting query=%s', JSON.stringify(query));
  return query;
}

/**
 * This function split string by ; on separate sql query, prepare array of sql query
 *
 * @param sql - string with set of query
 * @param body - values to prepare  Parameterized Query
 * @return preparedSql - array of prepared sql string
 */
function prepareQueries(sql, body) {
  console.log('Received SQL queries =%s', sql);
  const queries = sql
    .replace(/--[^\r\n]*/gm, '') // remove single line comments
    .replace(/\/\*[\w\W]*?(?=\*\/)\*\//gm, '') // remove multi-line comments
    .replace(/(\r\n|\n|\r)/gm, ' ') // remove newlines
    .replace(/\s+/g, ' ') // excess white space
    .split(/(?<!['"]);(?!['"])/g) // split into all statements
    .map(Function.prototype.call, String.prototype.trim)
    .filter(el => el.length !== 0); // remove any empty ones
  const preparedSql = [];
  queries.forEach(query => preparedSql.push(prepareQuery(query, body)));
  return preparedSql;
}

/**
 * This method will be called from elastic.io platform providing following data
 *
 * @param sql incoming sql string
 * @param values incoming values for prepare statement
 * @param cfg configuration that is account information and configuration field values
 */
module.exports.executeQuery = async function executeQuery(sql, values, cfg) {
  const queries = prepareQueries(sql, values);

  const db = clientPgPromise.getDb(cfg);

  return db.tx((t) => {
    const preparedQueries = [];
    queries.forEach((query) => {
      preparedQueries.push(t.any(query));
    });
    return t.batch(preparedQueries);
  })
    .then((data) => {
      console.log(`Query successfully executed, Data ${JSON.stringify(data)}`);
      return data;
    })
    .catch((error) => {
      if (Array.isArray(error) && 'getErrors' in error) {
        error.getErrors().forEach((err) => {
          this.emit('error', err.stack);
        });
      }
      console.log('Error:', error.message || error);
      this.emit('end');
    });
};

/**
 * This method will be called from elastic.io platform providing following data
 *
 * @param tableName incoming name of the table with schema or without
 * @return {table: {schema, table}}|{table}
 */
module.exports.getTableNameOption = function getTableNameOption(tableName) {
  const [schema, table] = tableName.includes('.') ? tableName.split('.') : [undefined, tableName];
  if (!schema) {
    return { table };
  }
  return { table: { table, schema } };
};

module.exports.prepareQuery = prepareQuery;
module.exports.prepareQueries = prepareQueries;
