# ZPZP Bot by neyzzz

Bot Discord **multifonctions en prefix** (français), SQLite, prêt pour **Pterodactyl**.

Préfixe par défaut : `+` (modifiable par serveur avec `+setprefix`)

## Fonctionnalités

- **Modération** — ban, kick, mute/timeout, warn, purge, lock, slowmode, softban…
- **Utilitaires** — help, ping, userinfo, serverinfo, avatar, poll, remind, afk, snipe, calc…
- **Fun** — 8ball, meme, cat/dog, rps, love, jokes…
- **Économie** — daily, work, crime, rob, bank, shop, inventory, leaderboard
- **Niveaux / XP** — rank, classement, level-up automatiques
- **Tickets** — panel bouton + close/add/remove
- **Suggestions** — suggest / approve / deny
- **Giveaways** — gstart / gend / greroll
- **Config** — prefix, welcome, leave, autorole, modlog, automod (anti-lien, anti-spam, mots interdits)

## Installation locale

```bash
npm install
cp .env.example .env
# Édite .env et mets ton DISCORD_TOKEN
npm start
```

## Portail Discord (obligatoire)

1. [Discord Developer Portal](https://discord.com/developers/applications) → ton application → **Bot**
2. Active ces **Privileged Gateway Intents** :
   - Server Members Intent
   - Message Content Intent
3. Invite le bot avec les permissions Administrateur (ou au minimum Manage Channels/Roles/Messages, Ban, Kick, Moderate Members, etc.)

## Hébergement Pterodactyl

1. Crée un serveur Node.js (egg Node.js recommandé, Node **18+**)
2. Upload le projet (ou clone git)
3. Dans les variables d’environnement du panel, ajoute au minimum :
   - `DISCORD_TOKEN` = ton token
   - `PREFIX` = `+` (optionnel)
   - `OWNER_IDS` = ton ID Discord (optionnel, pour `+eval`)
4. Startup command : `npm install && node index.js`  
   ou, si les deps sont déjà installées : `node index.js`
5. Assure-toi que le dossier `data/` est **persistant** (volume) pour garder la DB SQLite (`data/bot.db`)

### Variables d’environnement

| Variable | Description |
|---|---|
| `DISCORD_TOKEN` | Token du bot (**requis**) |
| `PREFIX` | Préfixe par défaut (`+`) |
| `EMBED_COLOR` | Couleur hex des embeds (`5865F2`) |
| `OWNER_IDS` | IDs owner séparés par des virgules |
| `DB_PATH` | Chemin SQLite (défaut `./data/bot.db`) |

## Commandes utiles au démarrage

```text
+help
+setprefix !
+setmodlog #logs
+setwelcome #accueil Bienvenue {user} sur {server} !
+ticketsetup CATEGORY_ID #panel @Support #logs-tickets
+setsuggest #suggestions
+automod antilink on
+automod antispam on
```

## Structure

```text
index.js
config.js
src/
  commands/   # commandes par catégorie
  events/     # ready, messages, welcome, tickets…
  database/   # SQLite (better-sqlite3)
  handlers/   # chargement cmds/events
  utils/      # embeds, helpers, modlog, giveaways
data/         # base SQLite (persistante)
```

## Notes

- Bot **privé** : un serveur ou peu de serveurs, pas conçu comme bot public listé.
- Pas de musique volontairement : sur Ptero, ffmpeg/voice est souvent fragile. Tout le reste est pensé pour marcher out-of-the-box.
- Les APIs fun (meme/cat/dog) nécessitent un accès internet sortant depuis le node Ptero.
