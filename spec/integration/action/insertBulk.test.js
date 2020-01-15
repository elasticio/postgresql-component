/* eslint-disable global-require */
const fs = require('fs');
const { expect } = require('chai');
const sinon = require('sinon');
const logger = require('@elastic.io/component-logger')();

const insertBulk = require('../../../lib/actions/insertBulk');

let emitter;

describe('insertBulk Action test', () => {
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
      values: [{
        col0: 1111117,
        col1: 'HelloFromBulk111',
      }, {
        col0: 1111118,
        col1: 'HelloFromBulk!111',
      }],
    },
  };
  const cfg = {
    conString: process.env.conString,
    columns: 'col0, col1',
    tableName: 'bulk_insert_test',
  };

  it('should inserted', async () => {
    await insertBulk.process.call(emitter, msg, cfg);
    expect(emitter.emit.calledWith('data')).to.be.equal(true);
    expect(emitter.emit.args[0][1].body).to.deep.equal({ result: 'Ok' });
  });
});
