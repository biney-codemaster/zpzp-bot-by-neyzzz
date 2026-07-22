const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const FLAG_PATH = path.resolve(process.cwd(), 'data', 'restart-flag.json');

function writeRestartFlag(data) {
  fs.mkdirSync(path.dirname(FLAG_PATH), { recursive: true });
  fs.writeFileSync(FLAG_PATH, JSON.stringify(data, null, 2), 'utf8');
}

function consumeRestartFlag() {
  if (!fs.existsSync(FLAG_PATH)) return null;
  try {
    const raw = fs.readFileSync(FLAG_PATH, 'utf8');
    fs.unlinkSync(FLAG_PATH);
    return JSON.parse(raw);
  } catch (err) {
    console.error('[restart:flag]', err);
    try {
      fs.unlinkSync(FLAG_PATH);
    } catch {
      /* ignore */
    }
    return null;
  }
}

/**
 * Spawn a new bot process, then let the current one exit.
 * Works even when the host does not auto-restart stopped processes.
 */
function spawnReplacementProcess() {
  const args = process.argv.slice(1);
  const child = spawn(process.execPath, args, {
    cwd: process.cwd(),
    detached: true,
    stdio: 'inherit',
    env: {
      ...process.env,
      ZPZP_RESTARTED: '1',
    },
  });
  child.unref();
  return child.pid;
}

async function performRestart(client, {
  channelId = null,
  messageId = null,
  requestedBy = null,
} = {}) {
  writeRestartFlag({
    channelId,
    messageId,
    requestedBy,
    at: Date.now(),
  });

  try {
    await client.destroy();
  } catch (err) {
    console.error('[restart:destroy]', err);
  }

  try {
    const pid = spawnReplacementProcess();
    console.log(`[restart] Spawned replacement process pid=${pid}`);
  } catch (err) {
    console.error('[restart:spawn]', err);
    // Fall back to exit — host may still restart us.
  }

  process.exit(0);
}

module.exports = {
  writeRestartFlag,
  consumeRestartFlag,
  spawnReplacementProcess,
  performRestart,
};
