module.exports = {
  name: 'messageDelete',
  execute(client, message) {
    if (!message.guild || message.author?.bot || !message.author) return;
    if (!client.snipes) client.snipes = new Map();

    client.snipes.set(message.channel.id, {
      content: message.content,
      author: message.author.tag,
      avatar: message.author.displayAvatarURL(),
      image: message.attachments.first()?.proxyURL || null,
      createdAt: message.createdAt,
    });
  },
};
