# postre-sql-component [![Build Status](https://travis-ci.org/elasticio/postgresql-component.svg?branch=master)](https://travis-ci.org/elasticio/postgresql-component) [![Dependency Status][https://david-dm.org/elasticio/postgresql-component.svg]][https://david-dm.org/elasticio/postgresql-component]
> PostgreSQL component for elastic.io platform

# postre-sql-component
&gt; PostreSQL component for the [elastic.io platform](http://www.elastic.io &#34;elastic.io platform&#34;)

&lt;%- componentDescription -&gt;. If you plan to **deploy it into [elastic.io platform](http://www.elastic.io &#34;elastic.io platform&#34;) you must follow sets of instructions to succseed**. 

## Before you Begin

Before you can deploy any code into elastic.io **you must be a registered elastic.io platform user**. Please see our home page at [http://www.elastic.io](http://www.elastic.io) to learn how. 

We&#39;ll use git and SSH public key authentication to upload your component code, therefore you must **[upload your SSH Key](http://docs.elastic.io/docs/ssh-key)**. 

&gt; If you fail to upload you SSH Key you will get **permission denied** error during the deployment.

## Getting Started

After registration and uploading of your SSH Key you can proceed to deploy it into our system. At this stage we suggest you to:
* [Create a team](http://docs.elastic.io/docs/teams) to work on your new component. This is not required but will be automatically created using random naming by our system so we suggest you name your team accordingly.
* [Create a repository](http://docs.elastic.io/docs/component-repositories) where your new component is going to *reside* inside the team that you have just created.

Now as you have a team name and component repository name you can add a new git remote where code shall be pushed to. It is usually displayed on the empty repository page:

```bash
$ git remote add elasticio your-team@git.elastic.io:your-repository.git
```

Obviously the naming of your team and repository is entierly upto you and if you do not put any corresponding naming our system will auto generate it for you but the naming might not entierly correspond to your project requirements.
Now we are ready to push it:

```bash
$ git push elasticio master
```

## License

Apache-2.0 © [elastic.io GmbH](http://elastic.io)


[npm-image]: https://badge.fury.io/js/postre-sql-component.svg
[npm-url]: https://npmjs.org/package/postre-sql-component
[travis-image]: https://travis-ci.org/elasticio/postre-sql-component.svg?branch=master
[travis-url]: https://travis-ci.org/elasticio/postre-sql-component
[daviddm-image]: https://david-dm.org/elasticio/postre-sql-component.svg?theme=shields.io
[daviddm-url]: https://david-dm.org/elasticio/postre-sql-component
