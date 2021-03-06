[![CircleCI](https://circleci.com/gh/elasticio/postgresql-component.svg?style=svg)](https://circleci.com/gh/elasticio/postgresql-component)
# postgresql-component 

> PostgreSQL component for the [elastic.io platform](http://www.elastic.io), supports AWS Redshift

This is an open source component for working with [PostgreSQL](https://en.wikipedia.org/wiki/PostgreSQL) object-relational database management system on [elastic.io platform](http://www.elastic.io "elastic.io platform") it also works well with [AWS Redshift](https://aws.amazon.com/redshift/).

# What's inside

With this component you will have following trigger:
 * SELECT - this trigger will execute an SQL query that returns multiple results, it has no limitations on the query but apparently best suited for SELECT type of queries

Following acitons are inside:
 * SELECT - same as above but as an action
 * INSERT/UPDATE/DELETE - this action executes the SQL query that returns no data, for example insert, delete or update. After query is executed original message will be pushed to the next component.
 * INSERT Bulk - this action executes the bulk INSERT SQL query and returns execution result. 
 * SQL Injection - **Expert mode.** This action executes the SQL query or SQL script without prepared statements and returns an array of results of execution each query.
 * SQL Query - **Expert mode.** This action executes the SQL query or SQL script with prepared statements and returns an array of results of execution each query. 
 JSONana expression can be used as a source of SQL query. 

### Completeness Matrix
![image](https://user-images.githubusercontent.com/40201204/61518227-bb985780-aa11-11e9-9d18-d2a9c3cc3e65.png)
[PostgreSQL Component Completeness Matrix](https://drive.google.com/open?id=1XQGqPAGUmT31EN1XRrk2iqRlPoqj5pi6E4KvsA7bayU)

### Environment Variables

No required Environment Variables

## Authentication

There are two options for authentication:
1. Filling out the Connection URI (host), Connection port, Database Name, User, and Password fields. This is the recommended method.
2. Adding a full PostgreSQL connection URL in the Connection String field to connect to your database, as follows:
```
postgresql://user:password@your.postgresql.host:5432/dbname
```

Note: if you fill out both the Connection String and all the other connection data fields, the platform will use the connection string to connect to the database.

The option `Allow self-signed certificates` add to connection options following:
```
ssl: {
    rejectUnauthorized: false
  }
```
It could be useful for instances that are is using self-signed SSL certificates (like [Heroku](https://help.heroku.com/MDM23G46/why-am-i-getting-an-error-when-i-upgrade-to-pg-8))

See more in [documentation](https://www.postgresql.org/docs/current/static/libpq-connect.html#LIBPQ-CONNSTRING).

## SELECT Action & Trigger  

This action & trigger are actually the same but can be used in two different scenarios - trigger as a first step and action in between other steps.

![image](https://user-images.githubusercontent.com/16806832/53738983-5e07d200-3e99-11e9-9b19-c56cb8579b3a.png)

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

### Known limitations

SELECT Action & Trigger does not support transactions.

## INSERT/UPDATE/DELETE Action

This action is useful if you want to insert, update or delete some data, returned value is ignored, number of affected rows you can see in the log file.

![image](https://user-images.githubusercontent.com/16806832/53739075-8d1e4380-3e99-11e9-882d-fe26430f8729.png)

Following configuration options are available:
 * **SQL Query** - here you can type your INSERT/UPDATE/DELETE query. Returned data will be ignored, so this component will simply push original message to the next component. You can use variables from incoming messages in the templates, see section below on how it works.

### Known limitations

Action does not support transactions.

## INSERT Bulk Action

This action is useful to execute a bulk insert query in one transaction. An incoming message needs to contain a body with an array of objects.

### Configuration field 

![image](https://user-images.githubusercontent.com/16806832/53736488-8c35e380-3e92-11e9-8975-7bf41742c160.png)

#### Table Name

You need to put the name of the table into field **Table Name** where you want to put multiple values.

#### Columns

You need to determine the name of the columns in which corresponding values will be inserted.

### Input metadata

**Values** - needs to contain an array of objects, each object needs to contain values that will be inserted in corresponding columns.

For example, you need to execute following query:
```$sql
INSERT INTO itemstable(id, text) VALUES (1, 'First item'), (2, 'Second item')
```
You need specify field  **Table Name** = 'itemstable', **Columns** = 'id, text' and **Values** needs to be:
```json
[
  {
    id: 1,
    text: 'First item'
  },
  {
    id: 2,
    text: 'Second item'
  }
]
```
All changes will rollback, if something wrong with data.

## SQL Query Action

**Expert mode**. You can execute SQL query or SQL script in this action.

### Configuration field

#### SQL Query 
Put your SQL expression to `SQL Query` for further execution.
You can put only one SQL query or several queries with delimiter `;`.
All queries are executed in one transaction. All changes will rollback if something wrong with one of the executions.
Also if you want to use prepared statements in your query,
you need define prepared statement variables like this way `sqlVariableName = @MetadataVariableName:type` where:
1. `sqlVariableName` - variable name in sql expression;
2. `MetadataVariableName` - variable name in metadata (it can be the same as `sqlVariableName`);
3. `type` - type of variable , following types are supported:
   * string (also default type if type is omitted)
   * number 
   * boolean 
   
For example, for sql expression `SELECT * FROM tableName WHERE column1 = 'text' AND column2 = 15` you need to use following template:
`SELECT * FROM tableName WHERE column1 = @column1:string AND column2 = @column2:number` and put values into generated metadata.

![image](https://user-images.githubusercontent.com/16806832/53731432-635a2200-3e83-11e9-9a4e-0fc26aeeb001.png)

### Input metadata
Input metadata is generated from `SQL Query` configuration field if this field contains at least one defined value.

### Output metadata

Output metadata is an array of arrays with the result of query execution and depends on the count of SQL queries which were executed. 
There is an empty array in output metadata, if execution does not return any results. 
For example, for sql script:
```$xslt
INSERT INTO tableOne (column1, column2) VALUES ('value1', 'value2');
SELECT * FROM table2;
```
the first sql query `INSERT INTO tableOne (column1, column2) VALUES ('value1', 'value2')` does not return any values and
the second sql query `SELECT * FROM table2` returns two records.
Output metadata for this example is:

```$xslt
[
  [],
  [
    {
      "col2": 123,
      "col1": "abc"
    },
    {
      "col2": 456,
      "col1": "def"
    }
  ]
]
``` 

## SQL Injection

**Expert mode**. You can execute Sql Injection in this action.
You can not use prepare statement there, for this purpose use **General Sql Query Action**.

### Input metadata

Input metadata contains two fields: 
* `SQL Expression`;
* `Number of retries in case of deadlock transaction`.

#### SQL Expression
You can put there SQL query, SQL script or set of SQL queries from the previous step.
You can put only one SQL query or several queries with delimiter `;`.
All queries are executed in one transaction. All changes will rollback if something wrong with one of the executions.
For example, you have some file with defined SQL script and want to execute this. You need to use some component
which can read this file on the previous step and return value like this:
```$xslt
  {
    "query_string": "INSERT INTO tableOne (column1, column2) VALUES ('value1', 'value2'); SELECT * FROM table2"
  }
```
and in this action you need put `query_string` (or some JSONata expression) to `Sql Injection string`:

![image](https://user-images.githubusercontent.com/40201204/62026183-f3a65400-b1e2-11e9-988a-db689dd33a95.png)

#### Number of retries in case of deadlock transaction
You can specify maximum number of retries, that is intended to help to solve lock's issues in case of a deadlock transaction.
The delay between retries is 1 second.
Default value for this configuration field is `0`, it means, that such behavior is switched off (by default) and no any retry will be performed in case of deadlocked transaction. 

### Output metadata

Output metadata is an array of arrays with the result of query execution and depends on the count of SQL queries which were executed. 
There is an empty array in output metadata, if execution does not return any results. 
For example, for sql script:
```$xslt
INSERT INTO tableOne (column1, column2) VALUES ('value1', 'value2');
SELECT * FROM table2;
```
the first sql query `INSERT INTO tableOne (column1, column2) VALUES ('value1', 'value2')` does not return any values and
the second sql query `SELECT * FROM table2` returns two records.
Output metadata for this example is:

```$xslt
[
  [],
  [
    {
      "col2": 123,
      "col1": "abc"
    },
    {
      "col2": 456,
      "col1": "def"
    }
  ]
]
``` 


## How SQL templates work

SQL language is pretty extensive and complicated, so we tried to design the templating as minimum invasive so that you could express your self in SQL with maximum flexibility. Implementation of the templating is based on [prepared statement](https://www.postgresql.org/docs/9.3/static/sql-prepare.html) and hence should be safe to many SQL injection attacs. Second technology that is used here is [JavaScript template literals](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals#Expression_interpolation) (we are using [this library](https://github.com/felixfbecker/node-sql-template-strings) internally) so you can even property traversal and string manipulation in the templates. Let us demonstrate how the templating works on a sample. Let's take an incoming message like this:

```json
{
  "body": {
    "name": "Homer Simpson",
    "age": 38,
    "address": {
      "street": "742 Evergreen Terrace",
      "city": "Springfield"
    }
  }
}
```

If we would like to insert it into the database, we would use following template:

```
INSERT INTO customers (name, age, address) VALUES (${name},${age},${address.street + address.city})
```

So as you can see in the example above type conversion will happen automatically and you can traverse and concatenate values.

Now the SELECT example:

```
SELECT * FROM customers WHERE address LIKE ${'%' + address.city + '%'}
```
Same as above, concatenation and traversal in action.

# Known limitations

There are several limitations of the component:

1. We are relying on standard type default js<->postgresql data-type coercion [see here](https://github.com/brianc/node-postgres#features)

If in doubt call support.

## License

Apache-2.0 © [elastic.io GmbH](http://elastic.io)


[travis-image]: https://travis-ci.org/elasticio/postgresql-component.svg?branch=master
[travis-url]: https://travis-ci.org/elasticio/postgresql-component
[daviddm-image]: https://david-dm.org/elasticio/postgresql-component.svg?theme=shields.io
[daviddm-url]: https://david-dm.org/elasticio/postgresql-component
