const { EmbedBuilder } = require('discord.js');
const { fetchMember } = require('../../utils/helpers');
const { color } = require('../../utils/embeds');
module.exports = {
  name: 'avatar', description: 'Show user avatar', category: 'utility', aliases: ['av', 'pp'], usage: '[member]', permLevel: 'user',
  async execute(client, message, args) {
    const member = (await fetchMember(message, args[0])) || message.member;
    const url = member.user.displayAvatarURL({ size: 1024 });
    return message.reply({ embeds: [new EmbedBuilder().setColor(color()).setTitle(member.user.tag).setImage(url).setURL(url)] });
  },
};
