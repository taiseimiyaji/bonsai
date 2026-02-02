const fs = require('node:fs');
const path = require('node:path');

const API_BASE = 'https://discord.com/api/v10';

function loadEnvFile() {
  const envPath = path.resolve(process.cwd(), '.env');
  if (!fs.existsSync(envPath)) return;
  const content = fs.readFileSync(envPath, 'utf8');
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const eqIndex = line.indexOf('=');
    if (eqIndex === -1) continue;
    const key = line.slice(0, eqIndex).trim();
    let value = line.slice(eqIndex + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

loadEnvFile();

const applicationId = process.env.DISCORD_APPLICATION_ID;
const botToken = process.env.DISCORD_BOT_TOKEN;
const guildId = process.env.DISCORD_GUILD_ID;

if (!applicationId) {
  throw new Error('DISCORD_APPLICATION_ID is required');
}
if (!botToken) {
  throw new Error('DISCORD_BOT_TOKEN is required');
}

const commands = [
  {
    name: 'atoraku-done',
    description: '対象ユーザーのアトラク列を済に更新',
    options: [
      { name: 'user1', description: '対象ユーザー1', type: 6, required: true },
      { name: 'user2', description: '対象ユーザー2', type: 6, required: false },
      { name: 'user3', description: '対象ユーザー3', type: 6, required: false },
      { name: 'user4', description: '対象ユーザー4', type: 6, required: false },
      { name: 'user5', description: '対象ユーザー5', type: 6, required: false },
    ],
  },
  {
    name: 'hokora-done',
    description: '対象ユーザーの祠列を済に更新',
    options: [
      { name: 'user1', description: '対象ユーザー1', type: 6, required: true },
      { name: 'user2', description: '対象ユーザー2', type: 6, required: false },
      { name: 'user3', description: '対象ユーザー3', type: 6, required: false },
      { name: 'user4', description: '対象ユーザー4', type: 6, required: false },
      { name: 'user5', description: '対象ユーザー5', type: 6, required: false },
    ],
  },
];

const endpoint = guildId
  ? `${API_BASE}/applications/${applicationId}/guilds/${guildId}/commands`
  : `${API_BASE}/applications/${applicationId}/commands`;

const scope = guildId ? `guild ${guildId}` : 'global';

async function register() {
  const res = await fetch(endpoint, {
    method: 'PUT',
    headers: {
      Authorization: `Bot ${botToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(commands),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Failed to register commands (${scope}): ${res.status} ${body}`);
  }

  const data = await res.json();
  console.log(`Registered ${data.length} commands (${scope}).`);
}

register().catch((err) => {
  console.error(err);
  process.exit(1);
});
