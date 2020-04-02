const fs = require('fs');
const { expect } = require('chai');
const logger = require('@elastic.io/component-logger')();

const verifyCredentials = require('../../../verifyCredentials');

describe('verifyCredentials', () => {
  if (fs.existsSync('.env')) {
    require('dotenv').config();
  }

  const connectionString = process.env.conString;

  const configuration = {
    host: process.env.host,
    port: process.env.port,
    database: process.env.database,
    user: process.env.user,
    password: process.env.password,
  };
  const wrongConfiguration = {
    host: 'test',
    database: 'test',
    user: 'test',
    password: 'test',
  };

  it('verify credentials true', async () => {
    await verifyCredentials.call({ logger }, configuration, (o, emittedData) => {
      expect(emittedData).to.deep.eql({ verified: true });
    });
  });

  it('verify credentials false', async () => {
    await verifyCredentials.call({ logger }, wrongConfiguration, (o, emittedData) => {
      expect(emittedData).to.deep.eql({ verified: false });
    });
  });
});
