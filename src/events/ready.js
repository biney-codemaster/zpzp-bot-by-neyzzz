const { EmbedBuilder, Events } = require('discord.js');
const { endGiveaway } = require('../utils/giveaways');
const { color } = require('../utils/embeds');
const { withEmoji } = require('../utils/emoji');
const { consumeRestartFlag } = require('../services/restart');
const { startPresenceRotation } = require('../services/presence');
const { formatDuration } = require('../utils/helpers');

module.exports = {
  name: Events.ClientReady,
  once: true,
  async execute(client) {
    console.log(`[READY] Logged in as ${client.user.tag}`);
    console.log(
      `[READY] ${client.guilds.cache.size} guild(s) • ${client.commands.size} commands • ${client.config.ownerIds.length} owner(s)`
    );

    startPresenceRotation(client);

    const restartFlag = consumeRestartFlag();
    if (restartFlag?.channelId) {
      try {
        const channel = await client.channels
          .fetch(restartFlag.channelId)
          .catch(() => null);
        if (channel?.isTextBased?.()) {
          const downtime = restartFlag.at
            ? formatDuration(Date.now() - restartFlag.at)
            : null;
          const embed = new EmbedBuilder()
            .setColor(color())
            .setTitle(withEmoji('admin', 'Bot restarted'))
            .setDescription(
              [
                `Connected as **${client.user.tag}**.`,
                downtime ? `Downtime: **${downtime}**` : null,
                restartFlag.requestedBy
                  ? `Requested by <@${restartFlag.requestedBy}>`
                  : null,
              ]
                .filter(Boolean)
                .join('\n')
            )
            .setTimestamp();

          let edited = false;
          if (restartFlag.messageId) {
            const old = await channel.messages
              .fetch(restartFlag.messageId)
              .catch(() => null);
            if (old) {
              await old.edit({ embeds: [embed] }).catch(() => null);
              edited = true;
            }
          }
          if (!edited) {
            await channel
              .send({
                content: restartFlag.requestedBy
                  ? `<@${restartFlag.requestedBy}>`
                  : undefined,
                embeds: [embed],
              })
              .catch(() => null);
          }
        }
      } catch (err) {
        console.error('[restart:announce]', err);
      }
    } else if (process.env.ZPZP_RESTARTED === '1') {
      console.log('[READY] Process was spawned by +restart');
    }

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
