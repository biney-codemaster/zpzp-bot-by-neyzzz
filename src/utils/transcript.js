const discordTranscripts = require('discord-html-transcripts');

/**
 * Build a Discord-like HTML transcript attachment from channel messages.
 * @param {import('discord.js').TextChannel} channel
 * @param {{ ticket?: object, closedBy?: import('discord.js').User, reason?: string|null }} meta
 */
async function buildTranscript(channel, meta = {}) {
  const filename = `transcript-${channel.name}-${channel.id}.html`;

  return discordTranscripts.createTranscript(channel, {
    limit: -1,
    returnType: discordTranscripts.ExportReturnType.Attachment,
    filename,
    saveImages: false,
    poweredBy: false,
    hydrate: true,
    footerText: meta.reason
      ? `Closed by ${meta.closedBy?.tag || 'staff'} · Reason: ${meta.reason} · {number} message{s}`
      : `Closed by ${meta.closedBy?.tag || 'staff'} · {number} message{s}`,
  });
}

module.exports = { buildTranscript };
