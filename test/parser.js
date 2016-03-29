var assert = require('assert');
var sqlParser = require('sql-parser');
var parser = sqlParser.parser;
var lexer = sqlParser.lexer;
var ParameterValue = sqlParser.nodes.ParameterValue;
var Op = sqlParser.nodes.Op;

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

describe('SQL Parser', function () {
    it('should parse statement', function () {
        var sql = "select foo,bar from users where ((id like $test) or (foo = $baz))";
        var tokens = lexer.tokenize(sql);
        var stmt = parser.parse(tokens);
        var params = collectParameters(stmt.where.conditions);
        assert.equal(params.length, 2);
        assert.equal(params.map((r) => r.value).join(','), 'test,baz');
        console.log(params);
        console.log(stmt.toString());

        // parser.parse(tokens).toString()
        //
        // var tokens = parser.lexer.tokenize(sql);
        // console.log(parser.parse(tokens));
    });
});