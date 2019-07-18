/* eslint-disable global-require,no-plusplus,no-unused-vars */
const fs = require('fs');
const { expect } = require('chai');
const sinon = require('sinon');
const clientPgPromise = require('../../../lib/clientPgPromise');
const utils = require('../../../lib/utils');

const generalSqlQuery = require('../../../lib/actions/executeSqlInjection');

let emitter;

describe('GeneralSqlQuery Action test', function () {
  this.timeout(5000);
  if (fs.existsSync('.env')) {
    require('dotenv').config();
  }
  beforeEach(() => {
    emitter = {
      emit: sinon.spy(),
    };
  });
  const msg = {
    body: {
      sql: 'SELECT \'abc\' AS col1, 123 AS col2; SELECT \'def\' AS col3, 456 AS col4',
    },
  };
  const result = [[{ col1: 'abc', col2: 123 }], [{ col3: 'def', col4: 456 }]];
  const msgWithError = {
    body: {
      sql: 'select * fjrom stg.testolha1 where column1 = @column1:number and column2 = @column2:string; select * from stg.testo',
    },
  };
  const msgWithDeadlock = {
    body: {
      sql: 'select f_test(\'blah\');',
    },
  };
  const cfg = {
    conString: process.env.conString,
  };

  const cfgWithDeadlock = {
    conString: process.env.conString,
    sql: 'select f_test(\'blah\');',
    retriesLeft: 3,
  };

  const promiseArray = [];

  it('should selected', async () => {
    await generalSqlQuery.process.call(emitter, msg, cfg);
    expect(emitter.emit.calledWith('data')).to.be.equal(true);
    expect(emitter.emit.args[0][1].body).to.deep.equal({ result });
  });

  it('should be error', async () => {
    await generalSqlQuery.process.call(emitter, msgWithError, cfg);
    expect(emitter.emit.calledWith('error')).to.be.equal(true);
  });

  it('should be deadlock', async () => {
    // for i in {1..3}; do psql elasticio_testdb postgres -c "select f_test('blah')"; done
    for (let i = 0; i < 3; i++) {
      promiseArray.push(generalSqlQuery.process.call(emitter, msgWithDeadlock, cfgWithDeadlock));
    }
    await Promise.all(promiseArray);

    expect(emitter.emit.withArgs('data').callCount).to.be.equal(3);
    expect(emitter.emit.withArgs('error').callCount).to.be.equal(0);
  });
});
