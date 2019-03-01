/* eslint-disable global-require */
const fs = require('fs');
const { expect } = require('chai');
const sinon = require('sinon');

const generalSqlQuery = require('../../lib/actions/executeSqlInjection');

let emitter;

describe('GeneralSqlQuery Action test', () => {
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
      sql: 'select * from stg.testolha1 where column1 = @column1:number and column2 = @column2:string; select * from stg.testo',
    },
  };
  const cfg = {
    conString: process.env.conString,
  };

  it('should selected', async () => {
    await generalSqlQuery.process.call(emitter, msg, cfg);
    expect(emitter.emit.calledWith('data')).to.be.equal(true);
  });
});
