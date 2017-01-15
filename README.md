# postgresql-component [![Build Status](https://travis-ci.org/elasticio/postgresql-component.svg?branch=master)](https://travis-ci.org/elasticio/postgresql-component) [![Dependency Status][daviddm-image]][daviddm-url]

> PostgreSQL component for the [elastic.io platform](http://www.elastic.io) that also works well with AWS Redshift

This is an open source component for working with [PostgreSQL](https://en.wikipedia.org/wiki/PostgreSQL) object-relational database management system on [elastic.io platform](http://www.elastic.io "elastic.io platform") it also works well with [AWS Redshift](https://aws.amazon.com/redshift/).

# What's inside

With this component you will have following trigger:
 * SELECT - this trigger will execute an SQL query that returns multiple results, it has no limitations on the query but apparently best suited for SELECT type of queries

Following acitons are inside:
 * SELECT - same as above but as an action
 * INSERT/UPDATE/DELETE - this action executes the SQL query that returns no data, for example insert, delete or update. After query is executed original message will be pushed to the next component.

## Authentication

You would need a full PosgreSQL connection URL to connect to your database, it should looks like this:

```
postgress://username:pa$$word@your.postgresql.host:5432/dbname
```

See more in [documentation](https://www.postgresql.org/docs/current/static/libpq-connect.html#LIBPQ-CONNSTRING).

## SELECT Action & Trigger

This action & trigger are actually the same but can be used in two different scenarios - trigger as a first step and action in between other steps.

![image](https://cloud.githubusercontent.com/assets/56208/21964885/84f528d6-db54-11e6-94ee-ecfb6d5fbef0.png)

Following configuration options are available:
 * **SQL Query** - here you can type your SELECT query that should return 0 or more (much more) data back to you. There is **no limit on number of rows** returned by your SELECT queries, we will fetch results in 1000 batches and push it to the next component. You can use variables from incoming messages in the templates, see section below on how it works.
 * **Bundle results in batches** - this option will influence how your results are returned to the next component, sometimes you would like to see and work with your results as stream (this is usefull for async processing) so that each row in your result will be placed in the individual message, however sometimes you would like to see the query result as a whole (and you don't expect too much rows as an output), then you can get all results grouped as batch (up to 1000 rows).

For example you have an SQL query that returns you 400 rows, if **Bundle results in batches** is enabled you'll get a single message with array of 400 elements in it:

```json
{
  "values" : [
    {"id": 1...},
    {"id": 2...}
    ...
  ]
}
```

and if no records were found you'll get a message with an empty array in it. This is sometimes usefull, especially when working with request-response kind of tasks.

If **Bundle results in batches** is disabled (and that's so by default) then you will get a message per resulting row, so in example above you'll get 400 messages. If query returned no data then no messages will be sent.

## INSERT/UPDATE/DELETE Action

This action is usefull if you want to insert, update or delete some data, returned value is ignored, number of affected rows you can see in the log file.

![image](https://cloud.githubusercontent.com/assets/56208/21964863/3dd48dde-db54-11e6-81db-41b38d7cb2bd.png)


## How SQL templates work

# Known limitations

There are several limitations of the component:

1. No transaction support
1. We are relying on standard type default js<->postgresql data-type coercion [see here](https://github.com/brianc/node-postgres#features)

If in doubt call support.

## License

Apache-2.0 © [elastic.io GmbH](http://elastic.io)


[travis-image]: https://travis-ci.org/elasticio/postgresql-component.svg?branch=master
[travis-url]: https://travis-ci.org/elasticio/postgresql-component
[daviddm-image]: https://david-dm.org/elasticio/postgresql-component.svg?theme=shields.io
[daviddm-url]: https://david-dm.org/elasticio/postgresql-component
