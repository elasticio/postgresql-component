/* eslint-disable no-unused-expressions */
const { expect } = require('chai');
const logger = require('@elastic.io/component-logger')();
const action = require('../../lib/actions/generalSqlQuery');

describe('Metadata test', () => {
  const cfg = {
    sql: 'INSERT INTO Test2.dbo.Tweets (Lang, Retweeted, Favorited, "Text", id, CreatedAt, Username, ScreenName) '
      + 'VALUES (@lang:string, @retweeted:float, @money:money, @favorited:boolean, '
      + '@text:string, @id:bigint, @created_at:date, @username:string, @screenname:string)',
  };

  it('should generate metadata', (done) => {
    action.getMetaModel.call({ logger }, cfg, (err, result) => {
      expect(err).to.be.null;
      expect(result).to.deep.equal({
        in: {
          properties: {
            created_at: {
              type: 'string',
            },
            favorited: {
              type: 'boolean',
            },
            id: {
              type: 'number',
            },
            lang: {
              type: 'string',
            },
            money: {
              type: 'number',
            },
            retweeted: {
              type: 'number',
            },
            screenname: {
              type: 'string',
            },
            text: {
              type: 'string',
            },
            username: {
              type: 'string',
            },
          },
          type: 'object',
        },
      });
      done();
    });
  });

  it('should not fail on empty query', (done) => {
    action.getMetaModel.call({ logger }, {}, (err, result) => {
      expect(err).to.be.null;
      expect(result).to.deep.equal({
        in: {
          properties: {},
          type: 'object',
        },
      });
      done();
    });
  });

  it('should not handle duplicate fields', (done) => {
    action.getMetaModel.call({ logger }, {
      sql: '@foo:string @foo:string @bar:date',
    }, (err, result) => {
      expect(err).to.be.null;
      expect(result).to.deep.equal({
        in: {
          type: 'object',
          properties: {
            foo: {
              type: 'string',
            },
            bar: {
              type: 'string',
            },
          },
        },
      });
      done();
    });
  });

  it('should assume default metadata as stirng', (done) => {
    action.getMetaModel.call({ logger }, {
      sql: 'INSERT INTO Test2.dbo.Tweets '
        + '(Lang, Retweeted, Favorited, "Text", id, CreatedAt, Username, ScreenName) '
        + 'VALUES (@lang, @retweeted:float, @money:money, @favorited:boolean, '
        + '@text, @id:bigint, @created_at:date, @username, @screenname)',
    }, (err, result) => {
      expect(err).to.be.null;
      expect(result).to.deep.equal({
        in: {
          properties: {
            created_at: {
              type: 'string',
            },
            favorited: {
              type: 'boolean',
            },
            id: {
              type: 'number',
            },
            lang: {
              type: 'string',
            },
            money: {
              type: 'number',
            },
            retweeted: {
              type: 'number',
            },
            screenname: {
              type: 'string',
            },
            text: {
              type: 'string',
            },
            username: {
              type: 'string',
            },
          },
          type: 'object',
        },
      });
      done();
    });
  });
});
