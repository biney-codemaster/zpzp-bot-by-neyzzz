const { ActivityType, EmbedBuilder, Events } = require('discord.js');
const { endGiveaway } = require('../utils/giveaways');

module.exports = {
  name: Events.ClientReady || 'ready',
  once: true,
  async execute(client) {
    console.log(`✅ Connecté en tant que ${client.user.tag}`);
    console.log(`📊 ${client.guilds.cache.size} serveur(s) | ${client.commands.size} commandes`);

    const updatePresence = () => {
      const guilds = client.guilds.cache.size;
      client.user.setPresence({
        activities: [
          {
            name: `+help | ${guilds} serveur${guilds > 1 ? 's' : ''}`,
            type: ActivityType.Watching,
          },
        ],
        status: 'online',
      });
    };

    updatePresence();
    setInterval(updatePresence, 10 * 60 * 1000);

    // Giveaways expirés
    setInterval(async () => {
      try {
        const giveaways = client.db.getActiveGiveaways();
        for (const g of giveaways) {
          if (g.ends_at <= Date.now()) {
            await endGiveaway(client, g.message_id);
          }
        }
      } catch (err) {
        console.error('[giveaway-check]', err);
      }
    }, 15_000);

    // Rappels
    setInterval(async () => {
      try {
        const due = client.db.getDueReminders();
        for (const r of due) {
          client.db.markReminderSent(r.id);
          const channel = await client.channels.fetch(r.channel_id).catch(() => null);
          if (!channel) continue;
          const embed = new EmbedBuilder()
            .setColor(0x5865f2)
            .setTitle('⏰ Rappel')
            .setDescription(r.content)
            .setTimestamp();
          await channel.send({ content: `<@${r.user_id}>`, embeds: [embed] }).catch(() => null);
        }
      } catch (err) {
        console.error('[reminder-check]', err);
      }
    }, 15_000);
  },
};
