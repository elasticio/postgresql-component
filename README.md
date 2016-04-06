# postgresql-component [![Build Status](https://travis-ci.org/elasticio/postgresql-component.svg?branch=master)](https://travis-ci.org/elasticio/postgresql-component) [![Dependency Status][daviddm-image]][daviddm-url]

> PostgreSQL component for the [elastic.io platform](http://www.elastic.io)

This is an open source component template for working with [PostgreSQL](https://en.wikipedia.org/wiki/PostgreSQL) object-relational database management system on [elastic.io platform](http://www.elastic.io "elastic.io platform"). You can clone it and change it as you wish. However, **if you plan to deploy it into [elastic.io platform](http://www.elastic.io "elastic.io platform") you must follow sets of instructions to succeed**.

## Before you Begin

Before you can deploy any code into elastic.io **you must be a registered elastic.io platform user**. Please see our home page at [http://www.elastic.io](http://www.elastic.io) to learn how.

We'll use git and SSH public key authentication to upload your component code, therefore you must **[upload your SSH Key](http://docs.elastic.io/docs/ssh-key)**.

> If you fail to upload you SSH Key you will get **permission denied** error during the deployment.

## Getting Started

After registration and uploading of your SSH Key you can proceed to deploy it into our system. At this stage we suggest you to:
* [Create a team](http://docs.elastic.io/page/team-management) to work on your new component. This is not required but will be automatically created using random naming by our system so we suggest you name your team accordingly.
* [Create a repository](http://docs.elastic.io/page/repository-management) where your new component is going to *reside* inside the team that you have just created.

Now as you have a team name and component repository name you can add a new git remote where code shall be pushed to. It is usually displayed on the empty repository page:

```bash
$ git remote add elasticio your-team@git.elastic.io:your-repository.git
```

Obviously the naming of your team and repository is entirely up-to you and if you do not put any corresponding naming our system will auto generate it for you but the naming might not entirely correspond to your project requirements.

Now we are ready to push it:

```bash
$ git push elasticio master
```

# How to use it

There are several limitations of the component:

1. Only ``SELECT`` queries are currently supported
2. Only valid ``SELECT`` queries are supported
3. When specifying your ``SELECT`` query you may not use ``*`` like in ``SELECT * FROM foo``. You always have to specify the comma-separated list of values you want to see in response.
4. You may augment your SQL query ``WHERE`` statement with the type information, e.g. ``SELECT a FROM foo WHERE age = $age:number``, supported type modifiers are ``number``, ``float``,``boolean`` and ``string``. When omitted ``string`` is assumed by default.

![image](https://cloud.githubusercontent.com/assets/56208/14229261/b6586dfa-f92f-11e5-8489-2042dc590915.png)

If in doubt call support.

## License

Apache-2.0 © [elastic.io GmbH](http://elastic.io)


[travis-image]: https://travis-ci.org/elasticio/postgresql-component.svg?branch=master
[travis-url]: https://travis-ci.org/elasticio/postgresql-component
[daviddm-image]: https://david-dm.org/elasticio/postgresql-component.svg?theme=shields.io
[daviddm-url]: https://david-dm.org/elasticio/postgresql-component
