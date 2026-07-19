# ZPZP Bot by neyzzz

Bot Discord **multifonctions prefix** — français — SQLite — prêt **Pterodactyl** (Node 18+).

Rebuild propre v2 : modules ciblés, permissions custom, embeds blancs, menu d’aide interactif.

## Modules

| Module | Contenu |
|---|---|
| Modération | ban, kick, mute, warn, purge, lock, softban, cases… + logs détaillés |
| Auto-mod | anti-lien, anti-spam, mots interdits |
| Welcome | welcome / leave / autorole |
| Tickets | panel bouton, close, add/remove |
| Giveaways | gstart / gend / greroll |
| Fun | 8ball, meme, cat/dog, rps… |
| Utilitaires | help interactif, infos, poll, remind, afk, snipe… |
| Config | prefix, rôles staff, modlog, automod… |

**Non inclus** (volontaire) : économie, niveaux, suggestions, musique.

## Permissions custom

| Niveau | Qui |
|---|---|
| `owner` | IDs dans `OWNER_IDS` |
| `admin` | Rôle admin bot **ou** Admin Discord / owner serveur |
| `mod` | Rôle modo bot (+ admin) |
| `user` | Tout le monde |

Setup recommandé :
```text
+setadminrole @Admin
+setmodrole @Modo
+setmodlog #logs
```

## Installation / Ptero

1. Egg **Node.js 18+**
2. Variables d’environnement :
   - `DISCORD_TOKEN` *(requis)*
   - `PREFIX=+`
   - `EMBED_COLOR=FFFFFF`
   - `OWNER_IDS=ton_id`
3. Startup : `npm install && node index.js`
4. Persiste le dossier `data/` (SQLite)
5. Intents Discord : **Message Content** + **Server Members**

## Premiers réglages

```text
+help
+setadminrole @Admin
+setmodrole @Staff
+setmodlog #mod-logs
+setwelcome #accueil Bienvenue {user} sur {server} !
+ticketsetup CATEGORY_ID #panel @Support #logs-tickets
+automod antilink on
+automod antispam on
```

## Structure

```text
index.js
config.js
src/
  commands/     # 1 fichier = 1 commande
  events/
  handlers/
  database/
  services/
  utils/
data/           # bot.db (persistant)
```
