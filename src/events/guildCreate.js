module.exports = {
  name: 'guildCreate',
  execute(client, guild) {
    client.db.ensureGuild(guild.id);
    console.log(`[GUILD] ${guild.name} (${guild.id})`);
  },
};
