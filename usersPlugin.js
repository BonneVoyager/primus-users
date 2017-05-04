'use strict';

var fs = require('fs'),
    path = require('path'),
    fuse = require('fusing');

/**
 * Users plugin allows to send messages to connections linked with users.
 * The plugin requires both omega-supreme and metroplex plugins added to primus before adding this.
 *
 * @param {Primus} primus The Primus instance that received the plugin.
 * @param {Object} options Configuration.
 * @api public
 */
var UsersPlugin = function (primus, options) {
  this.fuse();

  this.metroplex = primus.metroplex;

  this.uidKey = options.uidKey || 'uid';

  var users = this,
      lua = fs.readFileSync(path.join(__dirname, 'redis/annihilateUsers.lua'), 'utf8');

  primus.metroplex.redis.defineCommand('annihilateUsers', {
    lua: lua.replace('{leverage::namespace}', primus.metroplex.namespace),
    numberOfKeys: 1
  });

  primus.metroplex.on('register', function register(address) {
    primus.metroplex.redis.annihilateUsers(address, function annihilateUsers(err) {
      if (err) {
        return users.emit('error', err);
      }

      users.emit('wiped');
    });
  });

  require('./omega')(primus);
};

fuse(UsersPlugin, require('eventemitter3'));

/**
 * Add a new connection for user namespace.
 *
 * @param {Spark} spark The connection/spark from Primus.
 * @returns {Users}
 * @api public
 */
UsersPlugin.readable('connect', function connect(spark) {
  var uid = spark.request[this.users.uidKey],
      users = this.users;

  if (uid) {
    this.metroplex.redis.multi()
      .exists(this.metroplex.namespace + 'user:' + uid)
      .sadd(this.metroplex.namespace + this.metroplex.address + ':user:' + uid, spark.id)
      .sadd(this.metroplex.namespace + 'user:' + uid, spark.id)
      .exec()
      .then(function connect(res) {
        if (!res[0][0] && !res[0][1]) {
          users.emit('online', uid);
        }
      });
  }

  return this;
});

/**
 * Remove a connection for user namespace.
 *
 * @param {Spark} spark The connection/spark from Primus.
 * @returns {Users}
 * @api public
 */
UsersPlugin.readable('disconnect', function disconnect(spark) {
  var uid = spark.request[this.users.uidKey],
      users = this.users;

  if (uid) {
    this.metroplex.redis.multi()
      .srem(this.metroplex.namespace + this.metroplex.address + ':user:' + uid, spark.id)
      .srem(this.metroplex.namespace + 'user:' + uid, spark.id)
      .exists(this.metroplex.namespace + 'user:' + uid)
      .exec()
      .then(function disconnect(res) {
        if (!res[2][0] && !res[2][1]) {
          users.emit('offline', uid);
        }
      });
  }

  return this;
});

/**
 * Checks whether a user is online.
 *
 * @param {Mixed} uid user id
 * @param {Function} fn Callback
 * @returns {UsersPlugin}
 * @api public
 */
UsersPlugin.readable('isOnline', function allUsers(uid, fn) {
  var metroplex = this.metroplex,
      usersPrefix = metroplex.namespace + 'user:';

  return metroplex.redis.exists(`${usersPrefix}${uid}`, function isOnline(err, res) {
    if (err) return fn(err);

    return fn(err, !!res);
  })
});

/**
 * Checks whether the users are online.
 *
 * @param {Array} uids user ids
 * @param {Function} fn Callback
 * @returns {UsersPlugin}
 * @api public
 */
UsersPlugin.readable('areOnline', function allUsers(uids, fn) {
  var metroplex = this.metroplex,
      usersPrefix = metroplex.namespace + 'user:',
      redisMulti = metroplex.redis.multi(),
      result = [], i = 0, j = 0;

  for (; i < uids.length; i++) {
    redisMulti.exists(`${usersPrefix}${uids[i]}`);
  }

  return redisMulti.exec(function areOnline(err, res) {
    if (err) return fn(err);

    for (; j < res.length; j++) {
      result[result.length] = !!res[j][1];
    }

    return fn(err, result);
  });
});

/**
 * Get all current registered users.
 *
 * @param {Function} fn Callback
 * @returns {UsersPlugin}
 * @api public
 */
UsersPlugin.readable('allUsers', function allUsers(fn) {
  var metroplex = this.metroplex,
      usersPrefix = metroplex.namespace + 'user:',
      result = [], i = 0;

  metroplex.redis.keys(usersPrefix + '*', function keys(err, keys) {
    if (err) return fn(err);

    for (; i < keys.length; i++) {
      result[result.length] = keys[i].substr(usersPrefix.length);
    }

    return fn(err, result);
  });

  return this;
});

/**
 * Get all current registered users associated to this server.
 *
 * @param {Function} fn Callback
 * @returns {UsersPlugin}
 * @api public
 */
UsersPlugin.readable('serverUsers', function allUsers(fn) {
  var metroplex = this.metroplex,
      usersPrefix = metroplex.namespace + metroplex.address + ':user:',
      result = [], i = 0;

  metroplex.redis.keys(usersPrefix + '*', function keys(err, keys) {
    if (err) return fn(err);

    for (; i < keys.length; i++) {
      result[result.length] = keys[i].substr(usersPrefix.length);
    }

    return fn(err, result);
  });

  return this;
});

/**
 * Count all current registered users.
 *
 * @param {Function} fn Callback
 * @returns {UsersPlugin}
 * @api public
 */
UsersPlugin.readable('countAllUsers', function allUsers(fn) {
  var metroplex = this.metroplex,
      usersPrefix = metroplex.namespace + 'user:';

  metroplex.redis.keys(usersPrefix + '*', function keys(err, keys) {
    if (err) return fn(err);

    return fn(err, keys.length);
  });

  return this;
});

/**
 * Count all current registered users associated with this server.
 *
 * @param {Function} fn Callback
 * @returns {UsersPlugin}
 * @api public
 */
UsersPlugin.readable('countServerUsers', function allUsers(fn) {
  var metroplex = this.metroplex,
      usersPrefix = metroplex.namespace + metroplex.address + ':user:';

  metroplex.redis.keys(usersPrefix + '*', function keys(err, keys) {
    if (err) return fn(err);

    return fn(err, keys.length);
  });

  return this;
});

module.exports = UsersPlugin;
