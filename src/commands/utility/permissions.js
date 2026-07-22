const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { fetchMember } = require('../../utils/helpers');
const { color, error } = require('../../utils/embeds');

const INTERESTING = [
  'ViewChannel',
  'SendMessages',
  'ManageMessages',
  'EmbedLinks',
  'AttachFiles',
  'MentionEveryone',
  'ManageChannels',
  'ManageRoles',
  'KickMembers',
  'BanMembers',
  'ModerateMembers',
  'Administrator',
  'ManageGuild',
  'ViewAuditLog',
  'Connect',
  'Speak',
  'MuteMembers',
  'DeafenMembers',
  'MoveMembers',
];

module.exports = {
  name: 'permissions',
  description: 'Show member permissions in this channel',
  category: 'utility',
  aliases: ['perms', 'perm'],
  usage: '[member]',
  permLevel: 'user',
  async execute(client, message, args) {
    const member = (await fetchMember(message, args[0])) || message.member;
    if (!member) {
      return message.reply({ embeds: [error('Member not found.')] });
    }

    const perms = message.channel.permissionsFor(member);
    if (!perms) {
      return message.reply({
        embeds: [error('Could not resolve permissions.')],
      });
    }

    const lines = INTERESTING.map((name) => {
      const bit = PermissionFlagsBits[name];
      if (!bit) return null;
      const ok = perms.has(bit);
      return `${ok ? '[+]' : '[-]'} \`${name}\``;
    }).filter(Boolean);

    return message.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(color())
          .setTitle(`Permissions — ${member.user.tag}`)
          .setDescription(
            [
              `Channel: ${message.channel}`,
              `Administrator: **${perms.has(PermissionFlagsBits.Administrator) ? 'Yes' : 'No'}**`,
              '',
              lines.join('\n'),
            ].join('\n')
          )
          .setTimestamp(),
      ],
    });
  },
};
