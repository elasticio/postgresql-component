const clientPgPromise = require('./lib/clientPgPromise');

module.exports = async function verifyCredentials(credentials) {
  this.logger.info('Start verifying credentials');
  try {
    const db = await clientPgPromise.getDb(credentials, this.logger);
    await db.connect();
    await clientPgPromise.detachDb(this.logger);
    this.logger.info('Credentials successfully verified');
    return { verified: true };
  } catch (e) {
    this.logger.error('Credentials are not valid, error code: ', e.code);
    throw e;
  }
};
