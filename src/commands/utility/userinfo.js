const { EmbedBuilder } = require('discord.js');
const { fetchMember } = require('../../utils/helpers');
const { color, error } = require('../../utils/embeds');

module.exports = {
  name: 'userinfo',
  description: 'Show user info',
  category: 'utility',
  aliases: ['ui', 'whois', 'user'],
  usage: '[member]',
  permLevel: 'user',
  async execute(client, message, args) {
    const member = (await fetchMember(message, args[0])) || message.member;
    if (!member) {
      return message.reply({ embeds: [error('Member not found.')] });
    }

    const roles = member.roles.cache
      .filter((r) => r.id !== message.guild.id)
      .sort((a, b) => b.position - a.position);

    const roleList = roles.size
      ? roles
          .map((r) => r.toString())
          .slice(0, 30)
          .join(', ') + (roles.size > 30 ? ` …(+${roles.size - 30})` : '')
      : 'None';

    const flags = member.user.flags?.toArray?.() || [];
    const keyPerms = [
      'Administrator',
      'ManageGuild',
      'ManageChannels',
      'ManageRoles',
      'ManageMessages',
      'KickMembers',
      'BanMembers',
      'ModerateMembers',
      'MentionEveryone',
    ].filter((p) => member.permissions.has(p));

    const embed = new EmbedBuilder()
      .setColor(member.displayHexColor !== '#000000' ? member.displayHexColor : color())
      .setAuthor({
        name: member.user.tag,
        iconURL: member.user.displayAvatarURL({ size: 64 }),
      })
      .setThumbnail(member.user.displayAvatarURL({ size: 256 }))
      .addFields(
        { name: 'ID', value: member.id, inline: true },
        { name: 'Bot', value: member.user.bot ? 'Yes' : 'No', inline: true },
        {
          name: 'Nickname',
          value: member.nickname || 'None',
          inline: true,
        },
        {
          name: 'Created',
          value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:f>\n(<t:${Math.floor(member.user.createdTimestamp / 1000)}:R>)`,
          inline: true,
        },
        {
          name: 'Joined',
          value: member.joinedTimestamp
            ? `<t:${Math.floor(member.joinedTimestamp / 1000)}:f>\n(<t:${Math.floor(member.joinedTimestamp / 1000)}:R>)`
            : 'N/A',
          inline: true,
        },
        {
          name: 'Boosting',
          value: member.premiumSinceTimestamp
            ? `<t:${Math.floor(member.premiumSinceTimestamp / 1000)}:R>`
            : 'No',
          inline: true,
        },
        {
          name: 'Display color',
          value: member.displayHexColor || '#000000',
          inline: true,
        },
        {
          name: 'Timed out',
          value: member.isCommunicationDisabled() ? 'Yes' : 'No',
          inline: true,
        },
        {
          name: 'Badges',
          value: flags.length ? flags.map((f) => `\`${f}\``).join(', ') : 'None',
          inline: false,
        },
        {
          name: 'Key permissions',
          value: keyPerms.length
            ? keyPerms.map((p) => `\`${p}\``).join(', ')
            : 'None notable',
          inline: false,
        },
        {
          name: `Roles [${roles.size}]`,
          value: roleList.slice(0, 1024),
        }
      )
      .setFooter({ text: `Highest role: ${member.roles.highest.name}` })
      .setTimestamp();

    return message.reply({ embeds: [embed] });
  },
};
