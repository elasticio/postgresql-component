const assert = require('assert');
const utils = require('../lib/utils.js');
const eioUtils = require('elasticio-node').messages;
const SQL = require('sql-template-strings');

describe('Query builder', function () {
    it('should build a query', function () {
        process.env.ELASTICIO_TASK_ID = 'taskid';
        const sql = "INSERT INTO " +
            "books (name, author, isbn, category, recommended_age, pages, price) " +
            "VALUES  " +
            "(${name}, ${author}, ${isbn}, ${category}, ${recommendedAge}, ${pages}, ${price})";
        const msg = eioUtils.newMessageWithBody({
            author: "Charles Robert Darwin",
            isbn: "wft?",
            recommendedAge: 20,
            name: "Survival of the fittest",
            pages: 250,
            price: 22.45,
            category: 42
        });
        const result = utils.prepareStatement(sql, msg);
        assert(result);
        assert.equal(result.values.length, 7);
        assert.equal(result.values[1], "Charles Robert Darwin");
        assert.equal(result.values[6], 22.45);
        assert.equal(result.name, 'eio-query-taskid');
    });
});
