/* eslint-disable no-template-curly-in-string */
const assert = require('assert');
const eioUtils = require('elasticio-node').messages;
const logger = require('@elastic.io/component-logger')();
const utils = require('../../lib/utils.js');

describe('Query builder', () => {
  it('should build a query', () => {
    process.env.ELASTICIO_TASK_ID = 'taskid';
    const sql = 'INSERT INTO '
            + 'books (name, author, isbn, category, recommended_age, pages, price) '
            + 'VALUES  '
            + '(${name}, ${author}, ${isbn}, ${category}, ${recommendedAge}, ${pages}, ${price})';
    const msg = eioUtils.newMessageWithBody({
      author: 'Charles Robert Darwin',
      isbn: 'wft?',
      recommendedAge: 20,
      name: 'Survival of the fittest',
      pages: 250,
      price: 22.45,
      category: 42,
    });
    const result = utils.prepareStatement.call({ logger }, sql, msg);
    assert(result);
    assert.equal(result.values.length, 7);
    assert.equal(result.values[1], 'Charles Robert Darwin');
    assert.equal(result.values[6], 22.45);
    assert.equal(result.name, 'eio-query-taskid');
  });
});
