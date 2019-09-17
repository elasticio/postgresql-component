const fs = require('fs');
const { expect } = require('chai');
const sinon = require('sinon');

const query = require('../../../lib/actions/insert');

if (fs.existsSync('.env')) {
  // eslint-disable-next-line global-require
  require('dotenv').config();
}

const cfg = {
  conString: process.env.conString,
  query: 'DELETE FROM employee WHERE empid=1111',
};

const msg = {
  body: '',
};

describe('Tests INSERT, UPDATE, DELETE FROM actions', () => {
  const emitter = { emit: sinon.spy() };

  beforeEach(() => {
    emitter.emit.resetHistory();
  });

  it('Initial condition', async () => {
    await query.process.call(emitter, msg, cfg);
  });

  it('Should successfully insert', async () => {
    cfg.query = 'INSERT INTO employee VALUES (1111, \'hello\', \'world\', \'IT\')';
    await query.process.call(emitter, msg, cfg);
    expect(emitter.emit.calledOnce).to.be.equal(true);
    expect(emitter.emit.args[0][0]).to.be.equal('data');
  });

  it('Should fail to insert if the item already exists', async () => {
    await query.process.call(emitter, msg, cfg);
    expect(emitter.emit.calledOnce).to.be.equal(true);
    expect(emitter.emit.args[0][0]).to.be.equal('error');
    expect(emitter.emit.args[0][1].detail).to.be.equal('Key (empid)=(1111) already exists.');
  });

  it('Should successfully update on the inserted field', async () => {
    cfg.query = 'UPDATE employee SET department= \'invalid input\' WHERE empid=1111';
    await query.process.call(emitter, msg, cfg);
    expect(emitter.emit.calledOnce).to.be.equal(true);
    expect(emitter.emit.args[0][0]).to.be.equal('data');
  });

  it('Should fail to update on something that does not exist', async () => {
    cfg.query = 'UPDATE employee SET department= \'invalid input\' WHERE empid=1234567';
    const err = `Result from executing the query q=${cfg.query} values= resulted in 0 rows changed.`;
    await query.process.call(emitter, msg, cfg);
    expect(emitter.emit.calledOnce).to.be.equal(true);
    expect(emitter.emit.args[0][1]).to.include(new Error(err));
  });

  it('Should delete the item that exists', async () => {
    cfg.query = 'DELETE FROM employee WHERE empid=1111';
    await query.process.call(emitter, msg, cfg);
    expect(emitter.emit.calledOnce).to.be.equal(true);
    expect(emitter.emit.args[0][0]).to.be.equal('data');
  });

  it('Should fail to delete on something that does not exist', async () => {
    await query.process.call(emitter, msg, cfg);
    expect(emitter.emit.calledOnce).to.be.equal(true);
    expect(emitter.emit.args[0][0]).to.be.equal('error');
    expect(emitter.emit.args[0][1]).to.include(new Error('no rows changed'));
  });
});
