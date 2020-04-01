const fs = require('fs');
const { expect } = require('chai');
const logger = require('@elastic.io/component-logger')();

const verifyCredentials = require('../../../verifyCredentials');

describe('verifyCredentials', () => {
  if (fs.existsSync('.env')) {
    require('dotenv').config();
  }

  const configuration = {
    protocol: process.env.protocol,
    host: process.env.host,
    port: process.env.port,
    databaseName: process.env.databaseName,
    user: process.env.user,
    password: process.env.password,
    configurationProperties: process.env.configurationProperties,
  };
  const wrongConfiguration = {
    protocol: 'test',
    host: 'test',
    port: 'test',
    databaseName: 'test',
    user: 'test',
    password: 'test',
    configurationProperties: 'test',
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
