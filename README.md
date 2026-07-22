# ZPZP Bot by neyzzz

Multifunction Discord **prefix** bot — **English** — SQLite — ready for **Pterodactyl** (Node 18+).

White embeds, custom staff permissions, interactive help menu, custom emojis via `src/utils/emoji.js` (all `null` by default — **no unicode emojis** in the bot).

## Modules

| Module | Contents |
|---|---|
| Moderation | ban, kick, mute, warn, purge, lock, softban, cases… + detailed logs |
| Automod | anti-link, anti-spam, bad words |
| Welcome | welcome / leave / autorole |
| Tickets | panel button, staff controls, HTML transcript, logs |
| Giveaways | gcreate, gend, greroll, Enter/Leave buttons, requirements |
| Fun | 8ball, meme, cat/dog, trivia, hangman, ttt, leaderboard… |
| Utility | interactive help, enriched info, button polls, reminders, translate, weather… |
| Config | prefix, staff roles, modlog, automod… |

**Not included:** economy, levels, suggestions, music.

## Custom emojis

Edit `src/utils/emoji.js`:

```js
success: '<:ok:1234567890>',  // or null
error: null,
```

Use Discord custom emoji format `<:name:id>` / `<a:name:id>`, or leave `null`.

## Custom permissions

| Level | Who |
|---|---|
| `owner` | IDs in `OWNER_IDS` |
| `admin` | Bot admin role **or** Discord Admin / guild owner |
| `mod` | Bot mod role (+ admin) |
| `user` | Everyone |

```text
+setadminrole @Admin
+setmodrole @Mod
+setmodlog #logs
```

## Ptero setup

1. Node.js **18+** egg
2. Env vars: `DISCORD_TOKEN`, `PREFIX=+`, `EMBED_COLOR=FFFFFF`, `OWNER_IDS=`
3. Startup: `npm install && node index.js`
4. Persist `data/`
5. Intents: **Message Content** + **Server Members**

## First commands

```text
+help
+setadminrole @Admin
+setmodrole @Staff
+setmodlog #mod-logs
+setwelcome #welcome Welcome {user} to {server}!
+ticketsetup
+automod antilink on
+automod antispam on
```
