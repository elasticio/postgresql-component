var assert = require('assert');
var utils = require('../lib/utils.js');

describe('SQL Parser', function () {
    it('should parse statement', function () {
        var sql = "select foo:number, bar as boo:boolean,hasi from users where ((id like $test) or (foo = $baz:number))";
        var result = utils.parseSQL(sql);
        assert.equal(result.params.length, 2);
        assert.equal(result.params.map((r) => r.value + ':' + r.type + ':' + r.index).join(','), 'baz:number:0,test:string:1');
        assert.equal(result.fields.length, 3);
        assert.equal(result.fields.map((r) => r.value + ':' + r.type).join(','), 'foo:number,boo:boolean,hasi:string');
    });
});