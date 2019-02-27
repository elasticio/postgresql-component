/* eslint-disable global-require */
const fs = require('fs');
const { expect } = require('chai');
const sinon = require('sinon');

const insertBulk = require('../../lib/actions/insertBulk');

let emitter;

describe('insertBulk Action test', () => {
  if (fs.existsSync('.env')) {
    require('dotenv').config();
  }
  beforeEach(() => {
    emitter = {
      emit: sinon.spy(),
    };
  });
  const msg = {
    body: [{
      column1: 7,
      column2: 'HelloFromBulk',
      column3: 'Inserted',
    }, {
      column1: 8,
      column2: 'HelloFromBulk!',
      column3: 'InsertedOk',
    }],
  };
  const cfg = {
    conString: process.env.conString,
    query: 'INSERT INTO stg.testolha1(column1, column2, column3) VALUES(${column1}, ${column2}, ${column3})',
  };

  it('should inserted', async () => {
    await insertBulk.process.call(emitter, msg, cfg);
    expect(emitter.emit.calledWith('data')).to.be.equal(true);
  });
});
