/* eslint-disable global-require */
const fs = require('fs');
const { expect } = require('chai');
const sinon = require('sinon');
const logger = require('@elastic.io/component-logger')();

const generalSqlQuery = require('../../../lib/actions/generalSqlQuery');

let emitter;

describe('GeneralSqlQuery Action test', () => {
  if (fs.existsSync('.env')) {
    require('dotenv').config();
  }
  beforeEach(() => {
    emitter = {
      emit: sinon.spy(),
      logger,
    };
  });
  const msg = {
    body: {
      column1: 525,
      column2: 'Hello525',
    },
  };
  const { conString } = process.env;
  const cfg = {
    host: process.env.host,
    port: process.env.port,
    database: process.env.database,
    user: process.env.user,
    password: process.env.password,
    sql: 'SELECT \'abc\' AS col1, 123 AS col2; SELECT \'def\' AS col3, 456 AS col4',
  };

  const cfgWithError = {
    host: process.env.host,
    port: process.env.port,
    database: process.env.database,
    user: process.env.user,
    password: process.env.password,
    sql: 'select * froum stg.testolha1 where column1 = @column1:number and column2 = @column2:string; select * from stg.testo',
  };

  const result = [
    [
      {
        col1: 'abc',
        col2: 123,
      },
    ],
    [
      {
        col3: 'def',
        col4: 456,
      },
    ],
  ];

  it('should selected', async () => {
    await generalSqlQuery.process.call(emitter, msg, cfg);
    expect(emitter.emit.calledWith('data')).to.be.equal(true);
    expect(emitter.emit.args[0][1].body).to.deep.equal({ result });
  });

  it('should selected with configuration string', async () => {
    await generalSqlQuery.process.call(emitter, msg, { conString, ...cfg });
    expect(emitter.emit.calledWith('data')).to.be.equal(true);
    expect(emitter.emit.args[0][1].body).to.deep.equal({ result });
  });

  it('should be error', async () => {
    await generalSqlQuery.process.call(emitter, msg, cfgWithError);
    expect(emitter.emit.calledWith('error')).to.be.equal(true);
  });
});
