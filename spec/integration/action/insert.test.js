/* eslint-disable eol-last */
/* eslint-disable no-unused-vars */
const pg = require('pg');
const fs = require('fs');
const { expect } = require('chai');
const sinon = require('sinon');

const query = require('../../../lib/actions/insert');

if (fs.existsSync('.env')) {
  require('dotenv').config();
}

const cfg = {
  conString: process.env.conString,
  query: 'DELETE FROM employee WHERE empid=1111',
};

const msg = {
  body: '',
};

const result = [
  [{
    col1: 'hello',
    col2: 'world',
  }],
];

// const client = new pg.Client({
//   host: 'testdb.mochelasticio.org:5432',
//   username: 'elasticio',
//   password: '2uDyG4hHxR',
//   database: 'elasticio_testdb',
// });

describe('Tests INSERT, UPDATE, DELETE FROM actions', () => {
  const emitter = { emit: sinon.spy() };
  const connectSpy = sinon.stub(pg, 'connect');
  //const callbackClient = sinon.stub(connectSpy.client, 'query').yieldTo('');

  beforeEach(() => {
    emitter.emit.resetHistory();
    connectSpy.resetHistory();
  });

  it('Initial condition', async () => {
    await query.process.call(emitter, msg, cfg);
  });

  it('Should successfully insert', async () => {
    cfg.query = 'INSERT INTO employee VALUES (1111, \'hello\', \'world\', \'IT\')';
    await query.process.call(emitter, msg, cfg);
    expect(emitter.emit.calledOnce).to.be.equal(true);
  });

  it('Should fail to insert if the item already exists', async () => {
    await query.process.call(emitter, msg, cfg);
    // expect(emitter.emit.called).to.be.equal(true);
  });

  it('Should successfully update on the inserted field', () => {

  });

  it('Should fail to update on something that does not exist', () => {

  });

  it('Should delete the item that exists', () => {

  });

  it('Should fail to delete on something that does not exist', () => {

  });
});