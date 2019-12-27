const assert = require('assert');
const { expect } = require('chai');
const logger = require('@elastic.io/component-logger')();
const utils = require('../../lib/utils.js');

describe('SQL Parser', () => {
  it('should parse complex statement', () => {
    const sql = 'select foo:number, bar as boo:boolean,hasi from users where ((id like $test) or (foo = $baz:number))';
    const result = utils.parseSQL(sql);
    assert.strictEqual(result.params.length, 2);
    assert.strictEqual(result.params.map(r => `${r.value}:${r.type}`).join(','), 'baz:number,test:string');
    assert.strictEqual(result.fields.length, 3);
    assert.strictEqual(result.fields.map(r => `${r.value}:${r.type}`).join(','), 'foo:number,boo:boolean,hasi:string');
  });

  it('should parse simple statement without where clause', () => {
    const sql = 'select id,name,url,phone from companies';
    const result = utils.parseSQL(sql);
    assert.strictEqual(result.params.length, 0);
    assert.strictEqual(result.fields.length, 4);
    assert.strictEqual(result.fields.map(r => `${r.value}:${r.type}`).join(','), 'id:string,name:string,url:string,phone:string');
  });

  it('should parse query with *', () => {
    const sql = 'select * from films';
    const result = utils.parseSQL(sql);
    assert.strictEqual(result.params.length, 0);
    assert.strictEqual(result.fields.length, 0);
  });

  it('should produce a runnable query', () => {
    const sql = 'select id,name,url,phone from companies where name = $name';
    const result = utils.parseSQL(sql);
    assert.strictEqual(result.query, 'SELECT id, name, url, phone\n  FROM companies\n  WHERE (name = $1)');
    assert.strictEqual(result.params.length, 1);
    assert.strictEqual(result.params[0].type, 'string');
    assert.strictEqual(result.params[0].value, 'name');
  });
});

describe('Parameter parsing', () => {
  it('should handle simple list', () => {
    const params = [
      { value: 'foo', type: 'string' },
      { value: 'baz', type: 'string' },
    ];
    const result = utils.createParametersArray(params, {
      foo: 'bar',
    });
    assert.strictEqual(result.length, 2);
    assert.strictEqual(typeof result[0], 'string');
    assert.strictEqual(result[0], 'bar');
    assert.strictEqual(typeof result[2], 'undefined');
  });
  it('should handle types', () => {
    const params = [
      { value: 'foo', type: 'string' },
      { value: 'baz', type: 'number' },
      { value: 'bazStr', type: 'number' },
      { value: 'flo', type: 'float' },
      { value: 'bool', type: 'boolean' },
    ];
    const result = utils.createParametersArray(params, {
      foo: 'bar',
      baz: 123,
      bazStr: '123',
      flo: '123,4',
      bool: 'false',
    });
    assert.strictEqual(result.length, 5);
    assert.strictEqual(typeof result[0], 'string');
    assert.strictEqual(typeof result[1], 'number');
    assert.strictEqual(typeof result[2], 'number');
    assert.strictEqual(typeof result[3], 'number');
    assert.strictEqual(typeof result[4], 'boolean');
  });
});

describe('Prepare query string', () => {
  it('Should prepare Parameterized Query', () => {
    const column1 = 525;
    const column2 = 'Hello525';
    const sql = 'select * from stg.testTable1 where column1 = @column1:number and column2 = @column2:string';
    const preparedSql = {
      text: 'select * from stg.testTable1 where column1 = $1 and column2 = $2',
      values: [column1, column2],
    };
    const body = {
      column1,
      column2,
    };
    const result = utils.prepareQuery(logger, sql, body);
    expect(result).to.deep.equal(preparedSql);
  });

  it('Should return the same string', () => {
    const sql = 'select * from stg.testTable1';
    const body = {
      column1: 5,
      column2: 7,
    };
    const result = utils.prepareQuery(logger, sql, body);
    expect(result).to.deep.equal(sql);
  });

  it('Should return Error', () => {
    const sql = 'drop * from stg.testTable1';
    const body = {
      column1: 5,
      column2: 7,
    };
    try {
      utils.prepareQuery(logger, sql, body);
    } catch (error) {
      expect(error.toString()).to.equal('Error: DROP and ALTER commands are not allowed to execute');
    }
  });
});

describe('Prepare array of query string', () => {
  it('Should prepare array of Parameterized Query and simple query string', () => {
    const column1 = 525;
    const column2 = 'Hello525';
    const sql = 'select * from stg.testTable1 where column1 = @column1:number and column2 = @column2:string; select * from stg.testTable1';
    const preparedSql = [{
      text: 'select * from stg.testTable1 where column1 = $1 and column2 = $2',
      values: [column1, column2],
    }, 'select * from stg.testTable1'];
    const body = {
      column1,
      column2,
    };
    const result = utils.prepareQueries(logger, sql, body);
    expect(result).to.deep.equal(preparedSql);
  });

  it('Should prepare array of two Parameterized Queries', () => {
    const column1 = 525;
    const column2 = 'Hello525';
    const column3 = 'Test';
    const sql = 'select * from stg.testTable1 delimiter \';\' where column1 = @column1:number and column2 = @column2:string; select * from stg.testTable1 where column3 = @column3:string';
    const preparedSql = [{
      text: 'select * from stg.testTable1 delimiter \';\' where column1 = $1 and column2 = $2',
      values: [column1, column2],
    }, {
      text: 'select * from stg.testTable1 where column3 = $1',
      values: [column3],
    }];
    const body = {
      column1,
      column2,
      column3,
    };
    const result = utils.prepareQueries(logger, sql, body);
    expect(result).to.deep.equal(preparedSql);
  });

  it('Should return array whit one query string', () => {
    const sql = 'select * from stg.testTable1';
    const body = {
      column1: 5,
      column2: 7,
    };
    const result = utils.prepareQueries(logger, sql, body);
    expect(result).to.deep.equal([sql]);
  });


  it('Should remove comments', () => {
    const sql = 'select * from  /*Hello*/ stg.testTable1 --comments';
    const preparedSql = ['select * from stg.testTable1'];
    const result = utils.prepareQueries(logger, sql, {});
    expect(result).to.deep.equal(preparedSql);
  });
});
