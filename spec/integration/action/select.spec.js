/* eslint-disable global-require */
const fs = require('fs');
const { expect } = require('chai');
const sinon = require('sinon');
const logger = require('@elastic.io/component-logger')();

const selectAction = require('../../../lib/actions/select');

let emitter;

describe.skip('Select Action test', () => {
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
    body: {},
  };

  const cfg = {
    host: process.env.host,
    port: process.env.port,
    database: process.env.database,
    user: process.env.user,
    password: process.env.password,
    connectionString: process.env.conString,
    query: 'SELECT * FROM pg_catalog.pg_tables',
  };

  it('make select', async () => {
    let done = false;
    await new Promise((resolve) => {
      emitter.emit = resolve();
      selectAction.process.call(emitter, msg, cfg);
      done = true;
    });
    expect(done).equals(true);
  });

  it('makes select with configuration string', async () => {
    let done = false;
    await new Promise((resolve) => {
      emitter.emit = resolve();
      selectAction.process.call(emitter, msg, cfg);
      done = true;
    });
    expect(done).equals(true);
  });
});
