const sqlParser = require('sql-parser');

const parser = sqlParser.parser;
const lexer = sqlParser.lexer;
const nodes = sqlParser.nodes;
const ParameterValue = sqlParser.nodes.ParameterValue;
const Op = sqlParser.nodes.Op;
const _ = require('lodash');
const SQL = require('sql-template-strings');
const util = require('util');
const vm = require('vm');

const VARS_REGEXP = /@([\w_$][\d\w_$]*(:(string|boolean|date|number|bigint|float|real|money))?)/g;

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
 * This method returns an array of parameters created based on ordered array of parameter objects {type,value}
 * and source values
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
      return value == true || value === 'true';
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
  const result = context.__eio_eval_result;
  result.name = `eio-query-${process.env.ELASTICIO_TASK_ID}`;
  return result;
};

/**
 * Prepare parameters for later usage
 *
 * @param param
 */
function transformParameter(param, index) {
  extractType(param);
  const result = {
    value: param.value,
    type: param.type,
  };
  param.value = `$${index + 1}`;
  return result;
}

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

/**
 * Prepare fields for later use
 */
function transformFields(field) {
  let result = {};
  if (field.field instanceof nodes.LiteralValue && field.field.nested == false && field.field.value) {
    result.type = extractType(field.field);
    result.value = field.field.value;
    if (field.name && field.name instanceof nodes.LiteralValue && field.name.nested == false && field.name.value) {
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
  return result;
}

module.exports.prepareQuery = function prepareQuery(sql, body) {
  console.log('Received SQL=%s', sql);
  const vars = sql.match(VARS_REGEXP);
  let query;
  if (vars) {
    console.log('Found following prepared variable:type pairs=%j', vars);
    const values = [];
    let text;
    // eslint-disable-next-line
        for (const tuple of vars) {
      const i = +1;
      const [placeholder] = tuple.split(':');
      const name = placeholder.substr(1);
      text = sql.replace(tuple, `${name}=$${i}`);
      values.push(body[`${name}`]);
    }
    query = {
      text,
      values,
    };
  } else {
    query = sql;
  }
  console.log('Preparing statement created. Resulting query=%s', query);
  return query;
};
