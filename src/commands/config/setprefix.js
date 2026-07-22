const { success, error } = require('../../utils/embeds');
module.exports = {
  name: 'setprefix', description: 'Change the prefix', category: 'config', aliases: ['prefix'], usage: '<prefix>', permLevel: 'owner',
  async execute(client, message, args) {
    const prefix = args[0];
    if (!prefix || prefix.length > 5) return message.reply({ embeds: [error('Prefix must be 1 to 5 characters.')] });
    client.db.updateGuild(message.guild.id, { prefix });
    return message.reply({ embeds: [success(`New prefix: \`${prefix}\`\nExample: \`${prefix}help\``)] });
  },
};
