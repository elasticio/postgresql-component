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
    if (e.message.indexOf('SSL off') !== -1) {
      this.logger.error('Error occurred! It seems like it is used self-signed SSL certificates. Try to enable \'Allow self-signed certificates\' option and retry verification.');
    } else {
      this.logger.error('Error occurred during credentials verification. Credentials are not valid');
    }
    throw e;
  }
};
