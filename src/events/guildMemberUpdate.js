const { sendModLog } = require('../utils/modlog');
const { wasManualUnmute } = require('../services/moderation');

module.exports = {
  name: 'guildMemberUpdate',
  async execute(client, oldMember, newMember) {
    if (!newMember.guild) return;

    const hadTimeout = oldMember.communicationDisabledUntil;
    const hasTimeout = newMember.communicationDisabledUntil;

    if (hadTimeout && !hasTimeout) {
      if (wasManualUnmute(client, newMember.guild.id, newMember.id)) {
        return;
      }

      const botUser = client.user;
      await sendModLog(client, newMember.guild, {
        action: 'Timeout Expired',
        moderator: botUser,
        target: newMember.user,
        reason: 'Discord timeout ended automatically',
        extra: 'Auto-unmute logged',
      });
    }
  },
};
