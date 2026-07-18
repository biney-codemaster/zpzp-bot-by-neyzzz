const { fetchMember } = require('../../utils/helpers');
const { success, error } = require('../../utils/embeds');

module.exports = {
  name: 'setxp',
  description: 'Définit l\'XP d\'un membre',
  category: 'levels',
  usage: '<membre> <xp>',
  permissions: ['ManageGuild'],
  async execute(client, message, args) {
    const member = await fetchMember(message, args[0]);
    const xp = Math.floor(Number(args[1]));
    if (!member || Number.isNaN(xp) || xp < 0) {
      return message.reply({ embeds: [error('Usage : `+setxp @user 100`')] });
    }
    client.db.updateLevel(message.guild.id, member.id, { xp });
    return message.reply({ embeds: [success(`XP de ${member} défini à **${xp}**.`)] });
  },
};
