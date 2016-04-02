var assert = require('assert');
var utils = require('../lib/utils.js');

describe('SQL Parser', function () {
    it('should parse complex statement', function () {
        var sql = "select foo:number, bar as boo:boolean,hasi from users where ((id like $test) or (foo = $baz:number))";
        var result = utils.parseSQL(sql);
        assert.equal(result.params.length, 2);
        assert.equal(result.params.map((r) => r.value + ':' + r.type ).join(','), 'baz:number,test:string');
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

    it('should produce a runnable query', function() {
        var sql = "select id,name,url,phone from companies where name = $name";
        var result = utils.parseSQL(sql);
        assert.equal(result.query, 'SELECT id, name, url, phone\n  FROM companies\n  WHERE (name = $1)');
        assert.equal(result.params.length, 1);
        assert.equal(result.params[0].type, 'string');
        assert.equal(result.params[0].value, 'name');
    });
});

describe('Parameter parsing', function() {
    it("should handle simple list", function() {
        var params = [
            { value: 'foo', type: 'string' },
            { value: 'baz', type: 'string' }
        ];
        var result = utils.createParametersArray(params, {
            foo: 'bar'
        });
        assert.equal(result.length, 2);
        assert.equal(typeof result[0],'string');
        assert.equal(result[0], 'bar');
        assert.equal(typeof result[2],'undefined');
    });
    it("should handle types", function() {
        var params = [
            { value: 'foo', type: 'string' },
            { value: 'baz', type: 'number' },
            { value: 'bazStr', type: 'number' },
            { value: 'flo', type: 'float' },
            { value: 'bool', type: 'boolean' }
        ];
        var result = utils.createParametersArray(params, {
            foo: 'bar',
            baz: 123,
            bazStr: '123',
            flo: '123,4',
            bool: 'false'
        });
        assert.equal(result.length, 5);
        assert.equal(typeof result[0], 'string');
        assert.equal(typeof result[1], 'number');
        assert.equal(typeof result[2], 'number');
        assert.equal(typeof result[3], 'number');
        assert.equal(typeof result[4], 'boolean');
    });
});