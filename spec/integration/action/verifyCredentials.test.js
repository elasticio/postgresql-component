const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const logger = require('@elastic.io/component-logger')();
const verifyCredentials = require('../../../verifyCredentials');
const {
  configuration, cfgConString, wrongConfiguration, herokuConString,
} = require('../common');

const { conString } = cfgConString;
chai.use(chaiAsPromised);
const { expect } = chai;

describe('verifyCredentials', () => {
  it('successfully verifies credentials with the connection string', async () => {
    const emittedData = await verifyCredentials.call({ logger }, {
      conString,
      // allowSelfSignedCertificates: true,
    });
    expect(emittedData).to.deep.equal({ verified: true });
  });

  it('verify credentials true', async () => {
    const emittedData = await verifyCredentials.call({ logger }, configuration);
    expect(emittedData).to.deep.eql({ verified: true });
  });

  it('verify credentials false', async () => {
    await expect(verifyCredentials.call({ logger }, wrongConfiguration)).be.rejectedWith('getaddrinfo ENOTFOUND test');
  });

  it('verify credentials fail with herokuConString (SSL off), allowSelfSignedCertificates = false', async () => {
    await expect(verifyCredentials.call({ logger }, { conString: herokuConString })).be.rejected;
  });

  it('successfully verifies credentials with herokuConString, allowSelfSignedCertificates = true', async () => {
    const emittedData = await verifyCredentials.call({ logger }, {
      conString: herokuConString,
      allowSelfSignedCertificates: true,
    });
    expect(emittedData).to.deep.eql({ verified: true });
  });
});
