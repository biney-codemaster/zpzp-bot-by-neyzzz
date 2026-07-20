const { AttachmentBuilder } = require('discord.js');

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function formatTime(date) {
  return new Date(date).toISOString().replace('T', ' ').replace(/\.\d+Z$/, ' UTC');
}

/**
 * Build a clean HTML transcript attachment from channel messages.
 * @param {import('discord.js').TextChannel} channel
 * @param {{ ticket?: object, closedBy?: import('discord.js').User, reason?: string|null }} meta
 */
async function buildTranscript(channel, meta = {}) {
  const collected = [];
  let lastId;

  while (true) {
    const batch = await channel.messages.fetch({ limit: 100, ...(lastId ? { before: lastId } : {}) });
    if (!batch.size) break;
    collected.push(...batch.values());
    lastId = batch.last().id;
    if (batch.size < 100) break;
  }

  collected.sort((a, b) => a.createdTimestamp - b.createdTimestamp);

  const rows = collected
    .map((msg) => {
      const attachments = [...msg.attachments.values()]
        .map((a) => `<a href="${escapeHtml(a.url)}" target="_blank" rel="noreferrer">${escapeHtml(a.name)}</a>`)
        .join(', ');
      const content = escapeHtml(msg.content || '').replaceAll('\n', '<br>') || '<em>No content</em>';
      const embeds =
        msg.embeds.length > 0
          ? `<div class="embeds">${msg.embeds.length} embed(s)</div>`
          : '';

      return `
      <article class="msg">
        <header>
          <strong>${escapeHtml(msg.author.tag)}</strong>
          <span class="meta">${escapeHtml(msg.author.id)} · ${formatTime(msg.createdAt)}</span>
        </header>
        <div class="body">${content}</div>
        ${attachments ? `<div class="files">Files: ${attachments}</div>` : ''}
        ${embeds}
      </article>`;
    })
    .join('\n');

  const ticket = meta.ticket;
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Ticket transcript — #${escapeHtml(channel.name)}</title>
  <style>
    :root { color-scheme: light; --bg:#f7f7f8; --card:#fff; --text:#111; --muted:#666; --line:#e6e6e6; --accent:#111; }
    * { box-sizing: border-box; }
    body { margin: 0; font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif; background: var(--bg); color: var(--text); }
    .wrap { max-width: 860px; margin: 32px auto; padding: 0 16px 48px; }
    .card { background: var(--card); border: 1px solid var(--line); border-radius: 12px; padding: 20px 22px; margin-bottom: 16px; }
    h1 { font-size: 1.25rem; margin: 0 0 8px; }
    .sub { color: var(--muted); font-size: 0.92rem; line-height: 1.5; }
    .grid { display: grid; grid-template-columns: 140px 1fr; gap: 6px 12px; margin-top: 14px; font-size: 0.92rem; }
    .grid b { color: var(--muted); font-weight: 600; }
    .msg { border-top: 1px solid var(--line); padding: 14px 0; }
    .msg:first-child { border-top: 0; }
    .msg header { display: flex; flex-wrap: wrap; gap: 8px 12px; align-items: baseline; margin-bottom: 6px; }
    .meta { color: var(--muted); font-size: 0.82rem; }
    .body { line-height: 1.55; word-break: break-word; }
    .files, .embeds { margin-top: 8px; font-size: 0.85rem; color: var(--muted); }
    a { color: var(--accent); }
    footer { margin-top: 18px; color: var(--muted); font-size: 0.8rem; }
  </style>
</head>
<body>
  <div class="wrap">
    <section class="card">
      <h1>Ticket transcript</h1>
      <div class="sub">#${escapeHtml(channel.name)} · ${escapeHtml(channel.guild.name)}</div>
      <div class="grid">
        <b>Channel ID</b><span>${escapeHtml(channel.id)}</span>
        <b>Author</b><span>${ticket ? escapeHtml(ticket.user_id) : 'N/A'}</span>
        <b>Opened</b><span>${ticket ? formatTime(ticket.created_at) : 'N/A'}</span>
        <b>Closed by</b><span>${meta.closedBy ? `${escapeHtml(meta.closedBy.tag)} (${escapeHtml(meta.closedBy.id)})` : 'N/A'}</span>
        <b>Reason</b><span>${escapeHtml(meta.reason || 'None')}</span>
        <b>Messages</b><span>${collected.length}</span>
      </div>
    </section>
    <section class="card">
      ${rows || '<p class="sub">No messages.</p>'}
      <footer>Generated ${formatTime(Date.now())}</footer>
    </section>
  </div>
</body>
</html>`;

  return new AttachmentBuilder(Buffer.from(html, 'utf8'), {
    name: `transcript-${channel.name}-${channel.id}.html`,
  });
}

module.exports = { buildTranscript };
