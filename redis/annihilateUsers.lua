--
-- Gather all the information.
--
local namespace = '{leverage::namespace}'
local address = assert(KEYS[1], 'The server address is missing')
local userNamespace = 'user:'

--
-- Get all the users for our given address so we can nuke them from our "global"
-- spark registry.
--
local users = redis.call('KEYS', namespace .. address ..':user:*')

--
-- Iterate over all the users in our collection and completely nuke every spark
-- which is connected on the given user id and server address as they're dead.
--
for i = 1, #users do
  local userSparks = redis.call('SMEMBERS', users[i])
  local index = string.find(users[i], userNamespace)
  local userId = string.sub(users[i], index + string.len(userNamespace))

  for j = 1, #userSparks do
    redis.call('SREM', namespace .. userNamespace .. userId, userSparks[j])
    redis.call('HDEL', namespace ..'users', userSparks[j])
  end

  redis.call('DEL', users[i]);
end

return 1
