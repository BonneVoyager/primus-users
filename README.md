# Primus Users plugin

THIS IS A WORKING VERSION - tests to be added.

Users plugin is an extension for Metroplex and Omega Supreme Primus's plugins.
It associates sparks and servers with the users.

Q: Why would I use a plugin for a plugin?

A: Because it makes sense in this case. Users plugin uses both Metroplex
 and Omega Supreme's functionalities and extends them.

## Installation

You can install the module from NPM:

```
npm install --save primus-users
```

Once you've installed the module you can tell Primus to use the plugin:

```js
'use strict';

var http = require('http').createServer(),
    Primus = require('primus'),
    metroplex = require('metroplex'),
    omegaSupreme = require('omega-supreme'),
    usersPlugin = require('primus-users'),
    primus = new Primus(http, { transformer: 'uws' });
  
// first add Omega Supreme plugin
primus.plugin('omega-supreme', omegaSupreme);
// then add Metroplex plugin
primus.plugin('metroplex', metroplex);
// to finally add Users plugin
primus.use('users', usersPlugin);
```

## Usage

There is only one (optional) option you can use with Users plugin:

- *uidKey*: the key which will hold user's id (default is 'uid') in the request.
This can be done (as an example) on primus authorization. The key should be
added to the requests like this:
```js
var uid = 10;
function onAuthorize (request, done) {
  request[this.options.uidKey] = uid;
  done(!user ? new Error('No user') : void 0);
}
```

This option can be provided in the options object of the Primus server:

```js
primus = new Primus(http, {
  transformer: 'sockjs',
  uidKey: 'some_other_property_than_uid'
});
```

### Users plugin methods

User plugin exposes `primus.users` with following public methods available:

#### users.isOnline

```
users.isOnline(uid, fn)
```

Checks whether a user is online.

```js
users.isOnline(123, function (err, isOnline) {
  console.log(isOnline);
});
```

#### users.areOnline

```
users.areOnline(uids, fn)
```

Checks whether the users are online.

```js
users.areOnline([ 123, 234 ], function (err, areOnline) {
  console.log(areOnline);
});
```

#### users.allUsers

```
users.allUsers(fn)
```

Get all current registered users.

```js
users.allUsers(function (err, allUsers) {
  console.log(allUsers);
});
```

#### users.serverUsers

```
users.serverUsers(fn)
```

Get all current registered users associated with this server.

```js
users.serverUsers(function (err, serverUsers) {
  console.log(serverUsers);
});
```

#### users.countAllUsers

```
users.countAllUsers(fn)
```

Count all current registered users.

```js
users.countAllUsers(function (err, allUsersCount) {
  console.log(allUsersCount);
});
```

#### users.countServerUsers

```
users.countServerUsers(fn)
```

Count all current registered users associated with this server.

```js
users.countServerUsers(function (err, serverUsersCount) {
  console.log(serverUsersCount);
});
```

### Events

`primus.users` emits following public events:

##### online

```
users.on('online', fn)
```

Indicates that the user went online. This event is emitted only for the first
connection of the spark associated to the user id.

```js
users.on('online', function (uid) {
  console.log(uid);
});
```

##### offline

```
users.on('offline', fn)
```

Indicates that the user went offline. No spark sessions associated to the user
id are connected to the server anymore.

```js
users.on('offline', function (uid) {
  console.log(uid);
});
```

### Metroplex integration

Users plugin benefits from Metroplex Redis sparks/connections registry. The Users
plugin stores extra data in the database, so the connections can be associated with
the user ids. This gives you an information such as user online status. That
also means, that you can have this information from the outside of the process,
because it's stored in the database.

### Omega Supreme integration

Users plugin adds few additional methods to Omega Supreme's `primus.forward`:

#### forward.users

```
forward.users(uids, msg, fn)
```

Send a message to the users.

```js
forward.users([ 5, 17, 234 ], { data: 1 }, function (err, result) {
  console.log(result);
});
```

#### forward.user

```
forward.user(uid, msg, fn)
```

Send a message to a user.

```js
forward.user(5, { data: 1 }, function (err, result) {
  console.log(result);
});
```

## License

[MIT](LICENSE)
