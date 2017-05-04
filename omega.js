'use strict';

var async = require('async');

/**
 * A nope function allows for an optional callback pattern.
 *
 * @type {Function}
 * @private
 */
function nope() { }

/**
 * Omega supreme integration.
 *
 * @param {Primus} primus Primus instance
 * @api private
 */
module.exports = function forwards(primus) {
  if (!primus.forward) return;

  var metroplex = primus.metroplex,
      forward = primus.forward;

  /**
   * Maps the sparks to the servers.
   *
   * @param {Array} sparks An array of sparks.
   * @param {Array} servers An array of servers.
   * @returns {Object}
   * @api private
   */
  var mapServersToSparks = function (sparks, servers) {
    var result = {}, i = 0;

    for (; i < sparks.length; i++) {
      if (!result[servers[i]]) {
        result[servers[i]] = [];
      }
      result[servers[i]][result[servers[i]].length] = sparks[i];
    }

    return result;
  };

  /**
   * Send the messages.
   *
   * @param {Object} mappedSparks Result object generated from mapServersToSparks function.
   * @param {Object} msg Message to send.
   * @param {Function} fn Optional callback function.
   * @api private
   */
  var forwardMessage = function (mappedSparks, msg, fn) {
    var mappedServers = Object.keys(mappedSparks);
    async.each(mappedServers, function (mappedServer) {
      forward(mappedServer, msg, mappedSparks[mappedServer], fn);
    }, fn);
  };

  /**
   * Return unique and non-false values from array.
   *
   * @param {Value} value Iteration value.
   * @param {Number} index Iteration index.
   * @param {Array} self Iterated array.
   * @returns {Array}
   * @api private
   */
  var onlyUniqueAndNonFalse = function (value, index, self) {
    return !!value && self.indexOf(value) === index;
  };

  /**
   * Flattens sparks received from Redis multi function.
   *
   * @param {Array} redisMulti An array with Redis multi command results.
   * @returns {Array}
   * @api private
   */
  var flattenRedisMulti = function (redisMulti) {
    var result = [], i = 0, j;

    for (; i < redisMulti.length; i++) {
      if (!redisMulti[i][0] && redisMulti[i][1].length) {
        for (j = 0; j < redisMulti[i][1].length; j++) {
          result[result.length] = redisMulti[i][1][j];
        }
      }
    }

    return result;
  };

  /**
   * Broadcast a message to a user.
   *
   * @param {Number} uid User id.
   * @param {Mixed} msg Message to broadcast.
   * @param {Function} fn Completion callback.
   * @returns {Forward}
   * @api public
   */
  forward.user = function user(uid, msg, fn) {
    fn = fn || nope;
    var mappedSparks;

    metroplex.redis.smembers(metroplex.namespace + 'user:' + uid, function getUserSparks(err, sparks) {
      if (err) return fn(err);

      metroplex.sparks(sparks, function getSparksServers(err, servers) {
        if (err) return fn(err);

        mappedSparks = mapServersToSparks(sparks, servers);

        forwardMessage(mappedSparks, msg, fn);
      });
    });

    return forward;
  };

  /**
   * Broadcast a message to the users.
   *
   * @param {Array} uids User ids.
   * @param {Mixed} msg Message to broadcast.
   * @param {Function} fn Completion callback.
   * @returns {Forward}
   * @api public
   */
  forward.users = function user(uids, msg, fn) {
    fn = fn || nope;
    var i = 0, flattenedSparks, mappedSparks;
    uids = uids.filter(onlyUniqueAndNonFalse);

    var redisMulti = metroplex.redis.multi();
    for (; i < uids.length; i++) {
      redisMulti.smembers(metroplex.namespace + 'user:' + uids[i]);
    }

    redisMulti.exec(function getUsersSparks(err, redisMulti) {
      if (err) return fn(err);

      flattenedSparks = flattenRedisMulti(redisMulti);

      metroplex.sparks(flattenedSparks, function getSparksServers(err, servers) {
        if (err) return fn(err);

        mappedSparks = mapServersToSparks(flattenedSparks, servers);

        forwardMessage(mappedSparks, msg, fn);
      });
    });

    return forward;
  };
};
