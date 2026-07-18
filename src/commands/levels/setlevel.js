const { fetchMember } = require('../../utils/helpers');
const { success, error } = require('../../utils/embeds');

module.exports = {
  name: 'setlevel',
  description: 'Définit le niveau d\'un membre',
  category: 'levels',
  usage: '<membre> <niveau>',
  permissions: ['ManageGuild'],
  async execute(client, message, args) {
    const member = await fetchMember(message, args[0]);
    const level = Math.floor(Number(args[1]));
    if (!member || Number.isNaN(level) || level < 0 || level > 1000) {
      return message.reply({ embeds: [error('Usage : `+setlevel @user 10`')] });
    }
    client.db.updateLevel(message.guild.id, member.id, { level, xp: 0 });
    return message.reply({ embeds: [success(`Niveau de ${member} défini à **${level}**.`)] });
  },
};
