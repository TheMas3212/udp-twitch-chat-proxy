import * as IRC from '@themas3212/irc';
import { CHANNEL_BADGE, CHANNEL_BADGES, encodeColor, GLOBAL_BADGE, GLOBAL_BADGES, GLOBAL_LOOKUP, randomColor } from './constants';
import badWords from 'bad-words';
import profanity from 'profane-words';
import * as DGRAM from 'dgram';
import { createHash } from 'crypto';
import { CONFIG } from './config';

const PUNCTUATION = '[!]*';
const STRIP_PUNCTUATION = /[^a-zA-Z\d]*/g;
const VALID_USERNAME = /^[a-zA-Z0-9_]{1,25}$/;
const CHARS_LOWER = 'abcdefghijklmnopqrstuvwxyz';
const CHARS_UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const CHARS_NUM = '1234567890';
const CHARS_ALL = CHARS_LOWER + CHARS_UPPER + CHARS_NUM;

const PROFANITY_FILTER = new badWords();
PROFANITY_FILTER.addWords(...profanity);

function handleUsername(displayName: string, username: string) {
  if (typeof displayName === 'string' && displayName.match(VALID_USERNAME)) return displayName;
  if (typeof username === 'string' && username.match(VALID_USERNAME)) return username;
  return null;
}

function parseBadges(badgesTag: string) {
  const badges = badgesTag.split(',');
  let data: { channel?: CHANNEL_BADGE, global?: GLOBAL_BADGE } = {};
  for (const badge of badges) {
    const [type, level] = badge.split('/');
    if (GLOBAL_BADGES.includes(type)) {
      if (data.global) continue;
      switch (type) {
        case 'bits': {
        const count = parseInt(level);
        if (count <= 1) {
          data.global = GLOBAL_BADGE.BITS_1;
        } else if (count <= 100) {
          data.global = GLOBAL_BADGE.BITS_100;
        } else if (count <= 1000) {
          data.global = GLOBAL_BADGE.BITS_1000;
        } else if (count <= 5000) {
          data.global = GLOBAL_BADGE.BITS_5000;
        // } else if (count <= 10000) {
        } else {
          data.global = GLOBAL_BADGE.BITS_10000;
        // } else if (count <= 25000) {
        //   data.global = GLOBAL_BADGE.BITS_25000;
        // } else if (count <= 50000) {
        //   data.global = GLOBAL_BADGE.BITS_50000;
        // } else if (count <= 100000) {
        //   data.global = GLOBAL_BADGE.BITS_100000;
        // } else if (count <= 200000) {
        //   data.global = GLOBAL_BADGE.BITS_200000;
        // } else if (count <= 300000) {
        //   data.global = GLOBAL_BADGE.BITS_300000;
        // } else if (count <= 400000) {
        //   data.global = GLOBAL_BADGE.BITS_400000;
        // } else {
        //   data.global = GLOBAL_BADGE.BITS_500000;
        }
          break;
        }
        case 'sub-gifter': {
        const count = parseInt(level);
        if (count <= 1) {
          data.global = GLOBAL_BADGE.SUB_GIFT_1;
        } else if (count <= 5) {
          data.global = GLOBAL_BADGE.SUB_GIFT_5;
        } else if (count <= 10) {
          data.global = GLOBAL_BADGE.SUB_GIFT_10;
        } else if (count <= 25) {
          data.global = GLOBAL_BADGE.SUB_GIFT_25;
        } else if (count <= 50) {
          data.global = GLOBAL_BADGE.SUB_GIFT_50;
        } else {
        // } else if (count <= 100) {
          data.global = GLOBAL_BADGE.SUB_GIFT_100;
        // } else if (count <= 250) {
        //   data.global = GLOBAL_BADGE.SUB_GIFT_250;
        // } else if (count <= 500) {
        //   data.global = GLOBAL_BADGE.SUB_GIFT_500;
        // } else {
        //   data.global = GLOBAL_BADGE.SUB_GIFT_1000;
        }
          break;
        }
        case 'hype-train': {
          if (level === '1') {
            data.global = GLOBAL_BADGE.HYPETRAIN_1;
          } else {
            data.global = GLOBAL_BADGE.HYPETRAIN_2;
          }
          break;
        }
        case 'bits-leader': {
          if (level === '1') {
            data.global = GLOBAL_BADGE.BITS_LEADER_FIRST;
          } else if (level === '2') {
            data.global = GLOBAL_BADGE.BITS_LEADER_SECOND;
          } else {
            data.global = GLOBAL_BADGE.BITS_LEADER_THIRD;
          }
          break;
        }
        case 'sub-gift-leader': {
          if (level === '1') {
            data.global = GLOBAL_BADGE.SUB_GIFT_LEADER_FIRST;
          } else if (level === '2') {
            data.global = GLOBAL_BADGE.SUB_GIFT_LEADER_SECOND;
          } else {
            data.global = GLOBAL_BADGE.SUB_GIFT_LEADER_THIRD;
          }
          break;
        }


        default: {
          data.global = GLOBAL_LOOKUP[type];
        }
      }
    }
    if (CHANNEL_BADGES.includes(type)) {
      if (data.channel) continue;
      switch (type) {
        case 'subscriber': {
          const sublevel = parseInt(level);
          if (sublevel < 1000) {
            data.channel = CHANNEL_BADGE.SUBSCRIBER_TIER_1;
          } else if (sublevel < 2000) {
            data.channel = CHANNEL_BADGE.SUBSCRIBER_TIER_2;
          } else {
            data.channel = CHANNEL_BADGE.SUBSCRIBER_TIER_3;
          }
          break;
        }
      }
    }
  }
  // return (data.global | data.channel << 5);
  return { global: data.global, channel: data.channel };
}

async function main() {
  await CONFIG.parse();
  const TARGET_CHANNEL = CONFIG.getOption('channel');
  const KEYWORDS = CONFIG.getOption('keywords').split(';');
  const DISABLE_FILTER = CONFIG.getBool('disable_filter');

  const MSGREGEX = new RegExp(KEYWORDS.map((val) => {
    val = val.replaceAll(STRIP_PUNCTUATION, '');
    return `(${val.toLocaleLowerCase()}${PUNCTUATION})`;
  }).join('|'), 'i');

  initSocketServer();
  const client = new IRC.TwitchClient({
    ...IRC.TwitchClient.CONFIG_SSL_IRC,
    preConnectCommands: [
      IRC.TwitchClient.CAP_ALL
    ],
    nickname: IRC.TwitchClient.generateNickname(),
    autoReconnect: true
  });
  client.on('ready', async () => {
    await client.join(TARGET_CHANNEL);
    client.on('message', (msg) => {
      if (msg.command === 'PRIVMSG' && msg.channel === TARGET_CHANNEL) {
        let name = handleUsername(msg.tags['display-name'], msg.prefix.nickname);
        let bad_words = false;
        if (name === null) return; // console.log('Unencodable Name');
        if (PROFANITY_FILTER.isProfane(name)) {
          const orgName = name;
          while (PROFANITY_FILTER.isProfane(name)) {
            name = PROFANITY_FILTER.clean(name).split('').map((char, index) => {
              if (char !== '*') return char;
              if (CHARS_UPPER.includes(orgName[index])) return CHARS_UPPER[Math.floor(Math.random()*CHARS_UPPER.length)];
              if (CHARS_LOWER.includes(orgName[index])) return CHARS_LOWER[Math.floor(Math.random()*CHARS_LOWER.length)];
              if (CHARS_NUM.includes(orgName[index])) return CHARS_NUM[Math.floor(Math.random()*CHARS_NUM.length)];
              return CHARS_ALL[Math.floor(Math.random()*CHARS_ALL.length)];
            }).join('');
          }
          bad_words = true;
        }
        if (DISABLE_FILTER || MSGREGEX.test(msg.message.replaceAll(STRIP_PUNCTUATION, ''))) {
          const badges = parseBadges((msg.tags as any).badges);
          transmitMessage({
            global: badges.global,
            channel: badges.channel,
            username: name,
            bad_words,
            color: encodeColor((msg.tags as any).color),
            message: msg.message
          });
        } else {
          return; //console.log('Message Doesn\'t Match Filter');
        }
      }
    });
  });
  await client.connect();
}

const SocketClients: DGRAM.RemoteInfo[] = [];
let SocketServer: DGRAM.Socket;

function initSocketServer() {
  const host = CONFIG.getOption('udp_socket_server.host');
  const port = CONFIG.getInt('udp_socket_server.port');
  SocketServer = DGRAM.createSocket({ type: 'udp4' });
  SocketServer.bind(port, host);
  SocketServer.on('listening', () => {
    console.log(`listening on udp4://${host}:${port}`);
  });
  SocketServer.on('message', (msg, rinfo) => {
    try {
      const data = JSON.parse(msg.toString('utf8'));
      if (data.event === 'register') {
        SocketClients.push(rinfo);
        console.log('New Client:', rinfo);
      }
    } catch {};
  });
}

function calculateColorHash(username: string) {
  const hash = createHash('md5');
  hash.update(username);
  return parseInt(hash.digest('hex')[0], 16);
}

function transmitMessage(obj: {
  global: number,
  channel: number,
  username: string,
  bad_words: boolean,
  color: [number, number, number],
  message: string
}) {
  if (obj.username === undefined) return;
  if (obj.message === undefined) return;
  if (obj.global === undefined) obj.global = GLOBAL_BADGE.NO_BADGE;
  if (obj.channel === undefined) obj.channel = CHANNEL_BADGE.NO_BADGE;
  if (obj.color === undefined) obj.color = randomColor(calculateColorHash(obj.username));
  const message = JSON.stringify(obj);
  for (const client of SocketClients) {
    try {
      SocketServer.send(message+'\n', client.port, client.address);
    } catch (err) {
      console.log(err);
    }
  }
}

main();
