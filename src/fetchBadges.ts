import * as jsonfile from 'jsonfile';
import axios from 'axios';
import { writeFile } from 'fs/promises';
import { CONFIG } from './config';

const INCLUDE_BADGES = [
  'admin',
  'ambassador',
  'anonymous-cheerer',
  'bits',
  'bits-charity',
  'bits-leader',
  'broadcaster',
  'clip-champ',
  'extension',
  'founder',
  'glhf-pledge',
  'glitchcon2020',
  'global_mod',
  'hype-train',
  'moderator',
  'partner',
  'predictions',
  'premium',
  'staff',
  'sub-gift-leader',
  'sub-gifter',
  'subscriber',
  'turbo',
  'twitchbot',
  'twitchcon2017',
  'twitchcon2018',
  'twitchconAmsterdam2020',
  'twitchconEU2019',
  'twitchconNA2019',
  'twitchconNA2020',
  'user-anniversary',
  'vip',
];

const AUTHFILE = './auth.json';
const AUTH = jsonfile.readFileSync(AUTHFILE);
const CHANNEL = CONFIG.getOption('channel').replace('#', '');

const NAME_TO_ID = 'https://api.twitch.tv/helix/users?login=';
const GLOBAL_BADGES = 'https://api.twitch.tv/helix/chat/badges/global';
const CHANNEL_BADGES = `https://api.twitch.tv/helix/chat/badges?broadcaster_id=`;

async function validateAppAccessToken() {
  if (AUTH.APP_ACCESS_TOKEN === undefined || typeof AUTH.APP_ACCESS_TOKEN !== 'string') {
    return await generateAppAccessToken();
  } else {
    const res = await axios.get<any>('https://id.twitch.tv/oauth2/validate', {
      headers: {
        'Authorization': `Bearer ${AUTH.APP_ACCESS_TOKEN}`
      },
      validateStatus: () => true
    });
    if (res.status === 200) {
      return;
    } else {
      console.log('App Access Token Invalid');
      generateAppAccessToken();
    }
  }
}

async function generateAppAccessToken() {
  const res = await axios.post<any>(`\
https://id.twitch.tv/oauth2/token\
?client_id=${AUTH.CLIENT_ID}\
&client_secret=${AUTH.CLIENT_SECRET}\
&grant_type=client_credentials\
`);
  console.log('App Access Token Regenerated');
  AUTH.APP_ACCESS_TOKEN = res.data.access_token;
  jsonfile.writeFileSync(AUTHFILE, AUTH);
  return;
}

async function resolveNameToId(name: string) {
  const res = await axios.get<any>(NAME_TO_ID+name, {
    headers: {
      'Client-Id': `${AUTH.CLIENT_ID}`,
      'Authorization': `Bearer ${AUTH.APP_ACCESS_TOKEN}`
    }
  });
  return res.data.data[0].id;
}

async function saveBadge(name: string, url: string) {
  if (url === undefined) throw new Error();
  const res = await axios.get<any>(url, {
    responseType: 'arraybuffer'
  });
  console.log(name, url);
  await writeFile('./badges/'+name+'.png', res.data);
}

async function main() {
  await validateAppAccessToken();
  const res = await axios.get<any>(GLOBAL_BADGES, {
    headers: {
      'Client-Id': `${AUTH.CLIENT_ID}`,
      'Authorization': `Bearer ${AUTH.APP_ACCESS_TOKEN}`
    }
  });
  for (const badge of res.data.data) {
    if (INCLUDE_BADGES.includes(badge.set_id)) {
      for (const version of badge.versions) {
        await saveBadge(badge.set_id+'_'+version.id, version.image_url_4x);
      }
    }
  }
  const res2 = await axios.get<any>(CHANNEL_BADGES+(await resolveNameToId(CHANNEL)), {
    headers: {
      'Client-Id': `${AUTH.CLIENT_ID}`,
      'Authorization': `Bearer ${AUTH.APP_ACCESS_TOKEN}`
    }
  });
  for (const badge of res2.data.data) {
    if (INCLUDE_BADGES.includes(badge.set_id)) {
      for (const version of badge.versions) {
        await saveBadge(badge.set_id+'_'+version.id, version.image_url_4x);
      }
    }
  }
}

main();