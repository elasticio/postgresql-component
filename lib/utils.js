var sqlParser = require('sql-parser');
var parser = sqlParser.parser;
var lexer = sqlParser.lexer;
var nodes = sqlParser.nodes;
var ParameterValue = sqlParser.nodes.ParameterValue;
var Op = sqlParser.nodes.Op;
var _ = require('lodash');

/**
 * This function parses SQL into a usable form.
 * It's a sync function and in case of errors it will throw an exception
 *
 * @param sqlQuery
 */
module.exports.parseSQL = function parseSQL(sqlQuery) {
    var tokens = lexer.tokenize(sqlQuery);
    var stmt = parser.parse(tokens);
    var params = [], fields = [];
    if (stmt instanceof nodes.Select && stmt.where) {
        // Process parameters
        params = collectParameters(stmt.where.conditions);
        // Sort alphabetically
        params = _.sortBy(params, 'value');
        // Transform values
        params = params.map(transformParameter);

        // Process fields
        fields = stmt.fields.map(transformFields);
    }
    return {
        stmt: stmt,
        params: params,
        fields: fields
    }
};

/**
 * Prepare parameters for later usage
 *
 * @param param
 */
function transformParameter(param, index) {
    param.index = index;
    extractType(param);
    return param;
}

function extractType(object) {
    var values = object.value.split(':');
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
    var result = {};
    if (field.field instanceof nodes.LiteralValue && field.field.nested == false && field.field.value) {
        result.type = extractType(field.field);
        result.value = field.field.value;
        if (field.name && field.name instanceof nodes.LiteralValue && field.name.nested == false && field.name.value) {
            // Name has should overwrite settings on field if name is defined
            result.type = extractType(field.name);
            result.value = field.name.value;
        }
    } else {
        console.error('Can not transform field ' + field);
        throw new Error("Can not process field " + field);
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
        collectParameters(op.left, result)
    }
    if (op.right && op.right instanceof ParameterValue) {
        result.push(op.right);
    } else if (op.right instanceof Op) {
        collectParameters(op.right, result)
    }
    return result;
}

