'use strict';

//
// Expose the Users plugin.
//
var UsersPlugin = module.exports = require('./usersPlugin');

/**
 * Keep the presence or "state" of each user connection in Redis.
 *
 * @param {Primus} primus The Primus instance that received the plugin.
 * @param {Object} options The options that were supplied to Primus.
 * @api public
 */
UsersPlugin.server = function server(primus, options)  {
  var usersPlugin = new UsersPlugin(primus, options);

  primus
    .on('connection', usersPlugin.connect)
    .on('disconnection', usersPlugin.disconnect);

  primus.users = usersPlugin;
};
