const { ActivityType, EmbedBuilder, Events } = require('discord.js');
const { endGiveaway } = require('../utils/giveaways');
const { color } = require('../utils/embeds');

module.exports = {
  name: Events.ClientReady,
  once: true,
  async execute(client) {
    console.log(`✅ ${client.user.tag} en ligne`);
    console.log(`📊 ${client.guilds.cache.size} serveur(s) • ${client.commands.size} commandes`);

    const setPresence = () => {
      client.user.setPresence({
        activities: [{ name: '+help', type: ActivityType.Watching }],
        status: 'online',
      });
    };
    setPresence();
    setInterval(setPresence, 15 * 60 * 1000);

    setInterval(async () => {
      try {
        for (const g of client.db.getActiveGiveaways()) {
          if (g.ends_at <= Date.now()) await endGiveaway(client, g.message_id);
        }
      } catch (err) {
        console.error('[giveaway]', err);
      }
    }, 15_000);

    setInterval(async () => {
      try {
        for (const r of client.db.getDueReminders()) {
          client.db.markReminderSent(r.id);
          const channel = await client.channels.fetch(r.channel_id).catch(() => null);
          if (!channel) continue;
          await channel
            .send({
              content: `<@${r.user_id}>`,
              embeds: [
                new EmbedBuilder()
                  .setColor(color())
                  .setTitle('Rappel')
                  .setDescription(r.content)
                  .setTimestamp(),
              ],
            })
            .catch(() => null);
        }
      } catch (err) {
        console.error('[reminder]', err);
      }
    }, 15_000);
  },
};
