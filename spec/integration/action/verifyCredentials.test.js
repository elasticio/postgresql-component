const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const logger = require('@elastic.io/component-logger')();
const verifyCredentials = require('../../../verifyCredentials');
const { configuration, cfgConString, wrongConfiguration } = require('../common');

const { conString } = cfgConString;
chai.use(chaiAsPromised);
const { expect } = chai;

describe.skip('verifyCredentials', () => {
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
});
