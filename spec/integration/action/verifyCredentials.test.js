const fs = require('fs');
const { expect } = require('chai');

const verifyCredentials = require('../../../verifyCredentials');

describe('verifyCredentials', () => {
  if (fs.existsSync('.env')) {
    require('dotenv').config();
  }

  const configuration = {
    conString: process.env.conString,
  };
  const wrongConfiguration = {
    conString: 'test',
  };

  it('verify credentials true', async () => {
    await verifyCredentials(configuration, (o, emittedData) => {
      expect(emittedData).to.deep.eql({ verified: true });
    });
  });

  it('verify credentials false', async () => {
    await verifyCredentials(wrongConfiguration, (o, emittedData) => {
      expect(emittedData).to.deep.eql({ verified: false });
    });
  });
});
