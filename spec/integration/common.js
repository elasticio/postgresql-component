const fs = require('fs');

if (fs.existsSync('.env')) {
  // eslint-disable-next-line global-require,import/no-extraneous-dependencies
  require('dotenv').config();
}
const { host } = process.env;
const { port } = process.env;
const { database } = process.env;
const { user } = process.env;
const { password } = process.env;
const { conString } = process.env;
module.exports = {
  configuration: {
    host,
    port,
    database,
    user,
    password,
  },
  cfgConString: {
    conString,
  },
  wrongConfiguration: {
    host: 'test',
    database: 'test',
    user: 'test',
    password: 'test',
  },
};
