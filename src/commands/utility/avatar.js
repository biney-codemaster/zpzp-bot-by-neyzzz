const { EmbedBuilder } = require('discord.js');
const { fetchMember } = require('../../utils/helpers');
const { color } = require('../../utils/embeds');

module.exports = {
  name: 'avatar',
  description: 'Affiche l\'avatar d\'un utilisateur',
  category: 'utility',
  aliases: ['av', 'pp'],
  usage: '[membre]',
  async execute(client, message, args) {
    const member = (await fetchMember(message, args[0])) || message.member;
    const url = member.user.displayAvatarURL({ size: 1024 });
    const embed = new EmbedBuilder().setColor(color()).setTitle(`Avatar de ${member.user.tag}`).setImage(url).setURL(url);
    return message.reply({ embeds: [embed] });
  },
};
