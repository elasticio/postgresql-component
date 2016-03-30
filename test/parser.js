var assert = require('assert');
var utils = require('../lib/utils.js');

describe('SQL Parser', function () {
    it('should parse complex statement', function () {
        var sql = "select foo:number, bar as boo:boolean,hasi from users where ((id like $test) or (foo = $baz:number))";
        var result = utils.parseSQL(sql);
        assert.equal(result.params.length, 2);
        assert.equal(result.params.map((r) => r.value + ':' + r.type + ':' + r.index).join(','), 'baz:number:0,test:string:1');
        assert.equal(result.fields.length, 3);
        assert.equal(result.fields.map((r) => r.value + ':' + r.type).join(','), 'foo:number,boo:boolean,hasi:string');
    });

    it('should parse simple statement without where clause', function () {
        var sql = "select id,name,url,phone from companies";
        var result = utils.parseSQL(sql);
        assert.equal(result.params.length, 0);
        assert.equal(result.fields.length, 4);
        assert.equal(result.fields.map((r) => r.value + ':' + r.type).join(','), 'id:string,name:string,url:string,phone:string');
    });

});