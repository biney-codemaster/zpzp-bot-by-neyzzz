const { ActivityType, EmbedBuilder, Events } = require('discord.js');
const { endGiveaway } = require('../utils/giveaways');
const { color } = require('../utils/embeds');

module.exports = {
  name: Events.ClientReady,
  once: true,
  async execute(client) {
    console.log(`[READY] Logged in as ${client.user.tag}`);
    console.log(`[READY] ${client.guilds.cache.size} guild(s) • ${client.commands.size} commands`);

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
          const channel = await client.channels.fetch(r.channel_id).catch(() => null);
          if (!channel) {
            client.db.markReminderSent(r.id);
            continue;
          }
          const sent = await channel
            .send({
              content: `<@${r.user_id}>`,
              embeds: [
                new EmbedBuilder()
                  .setColor(color())
                  .setTitle('Reminder')
                  .setDescription(r.content)
                  .setFooter({ text: `Reminder #${r.id}` })
                  .setTimestamp(),
              ],
            })
            .catch(() => null);
          if (sent) client.db.markReminderSent(r.id);
        }
      } catch (err) {
        console.error('[reminder]', err);
      }
    }, 15_000);
  },
};
