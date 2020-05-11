/* eslint-disable global-require,no-plusplus,no-unused-vars,no-multi-str */
const fs = require('fs');
const { expect } = require('chai');
const sinon = require('sinon');
const logger = require('@elastic.io/component-logger')();
const generalSqlQuery = require('../../../lib/actions/executeSqlInjection');
const clientPgPromise = require('../../../lib/clientPgPromise');

// eslint-disable-next-line func-names
describe('GeneralSqlQuery Action test', function () {
  this.timeout(5000);
  if (fs.existsSync('.env')) {
    require('dotenv').config();
  }

  const emitter = {
    emit: sinon.spy(),
    logger,
  };

  afterEach(() => {
    emitter.emit.resetHistory();
  });

  before(async () => {
    const cfg = {
      host: process.env.host,
      port: process.env.port,
      database: process.env.database,
      user: process.env.user,
      password: process.env.password,
    };

    const msgCreateTable = {
      body: {
        sql: 'CREATE TABLE IF NOT EXISTS public.test(id SERIAL PRIMARY KEY, val TEXT);',
      },
    };

    const msgCreateFunction = {
      body: {
        sql: 'CREATE OR REPLACE FUNCTION f_test(v TEXT)\
                             RETURNS INTEGER LANGUAGE SQL SECURITY DEFINER SET search_path = postgres,pg_temp as $$\
                             LOCK test IN EXCLUSIVE MODE;\
                             INSERT INTO public.test(val) SELECT v WHERE NOT EXISTS(\
                               SELECT * FROM public.test WHERE val=v\
                             );\
                             SELECT id FROM public.test WHERE val=v;\
                             $$;',
      },
    };

    const db = clientPgPromise.getDb(cfg);

    db.tx((t) => t.batch([msgCreateTable.sql])).then((data) => {
      emitter.logger.info('Table was created successfully');
      return data;
    }).catch((error) => {
      emitter.logger.info('Error:', error.message || error);
    });

    db.tx((t) => t.batch([msgCreateFunction.sql])).then((data) => {
      emitter.logger.info('Table was created successfully');
      return data;
    }).catch((error) => {
      emitter.logger.info('Error:', error.message || error);
    });
  });

  after(() => {
    const cfg = {
      host: process.env.host,
      port: process.env.port,
      database: process.env.database,
      user: process.env.user,
      password: process.env.password,
    };

    const msgDeleteTable = {
      body: {
        sql: 'DROP TABLE IF EXISTS public.test;',
      },
    };

    const msgDeleteFunction = {
      body: {
        sql: 'DROP FUNCTION IF EXISTS f_test(v TEXT);',
      },
    };

    const db = clientPgPromise.getDb(cfg);

    db.tx((t) => t.batch([msgDeleteTable.sql])).then((data) => {
      emitter.logger.info('Table was deleted successfully');
      return data;
    }).catch((error) => {
      emitter.logger.info('Error:', error.message || error);
    });

    db.tx((t) => t.batch([msgDeleteFunction.sql])).then((data) => {
      emitter.logger.info('Table was deleted successfully');
      return data;
    }).catch((error) => {
      emitter.logger.info('Error:', error.message || error);
    });
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

  const { conString } = process.env;

  const cfg = {
    host: process.env.host,
    port: process.env.port,
    database: process.env.database,
    user: process.env.user,
    password: process.env.password,
  };

  const cfgWithDeadlock = {
    host: process.env.host,
    port: process.env.port,
    database: process.env.database,
    user: process.env.user,
    password: process.env.password,
    sql: 'select f_test(\'blah\');',
    retriesLeft: 3,
  };

  const promiseArray = [];

  it('should selected', async () => {
    await generalSqlQuery.process.call(emitter, msg, cfg);
    expect(emitter.emit.calledWith('data')).to.be.equal(true);
    expect(emitter.emit.args[0][1].body).to.deep.equal({ result });
  });

  it('should selected with configuration string', async () => {
    await generalSqlQuery.process.call(emitter, msg, { conString });
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
      promiseArray.push(
        generalSqlQuery.process.call(emitter, msgWithDeadlock, cfgWithDeadlock),
      );
    }
    await Promise.all(promiseArray);

    expect(emitter.emit.withArgs('data').callCount).to.be.equal(3);
    expect(emitter.emit.withArgs('error').callCount).to.be.equal(0);
  });
});
