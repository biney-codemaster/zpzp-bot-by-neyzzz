module.exports = {
  name: 'messageReactionAdd',
  async execute(client, reaction, user) {
    if (user.bot) return;
    if (reaction.partial) {
      try {
        await reaction.fetch();
      } catch {
        return;
      }
    }
    if (reaction.emoji.name !== '🎉') return;

    const giveaway = client.db.getGiveaway(reaction.message.id);
    if (!giveaway || giveaway.ended) return;

    const entries = new Set(giveaway.entries || []);
    if (entries.has(user.id)) return;
    entries.add(user.id);
    client.db.updateGiveaway(reaction.message.id, { entries: [...entries] });
  },
};
