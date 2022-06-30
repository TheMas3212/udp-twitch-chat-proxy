import * as IRC from '@themas3212/irc';
import { CHANNEL_BADGE, CHANNEL_BADGES, encodeColor, GLOBAL_BADGE, GLOBAL_BADGES, GLOBAL_LOOKUP, randomColor } from './constants';
import PROFANITY_FILTER from 'leo-profanity';
import * as DGRAM from 'dgram';
import { createHash } from 'crypto';
import { CONFIG } from './config';
import { readFileSync } from 'fs';

const PUNCTUATION = '[!]*';
const STRIP_PUNCTUATION = /[^a-zA-Z\d]*/g;
const VALID_USERNAME = /^[a-zA-Z0-9_]{1,25}$/;
const CHARS_LOWER = 'abcdefghijklmnopqrstuvwxyz';
const CHARS_UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const CHARS_NUM = '1234567890';
const CHARS_ALL = CHARS_LOWER + CHARS_UPPER + CHARS_NUM;

const wordlist = readFileSync(`${__dirname}/../wordlist/words.txt`, 'utf8').split('\n').filter((str) => str.length > 0);

// const PROFANITY_FILTER = new badWords({
//   list: wordlist
// });
// const LEET_PROFANITY_FILTER = new badWords({
//   list: wordlist.map(deleet)
// });

PROFANITY_FILTER.clearList();
PROFANITY_FILTER.add(wordlist);
PROFANITY_FILTER.add(wordlist.map(deleet));

function handleUsername(displayName: string, username: string) {
  if (typeof displayName === 'string' && displayName.match(VALID_USERNAME)) return displayName;
  if (typeof username === 'string' && username.match(VALID_USERNAME)) return username;
  return null;
}

function deleet(str: string) {
  return str
    .replace(/4/g,         'a')
    .replace(/8/g,         'b')
    .replace(/3/g,         'e')
    .replace(/9/g,         'g')
    // .replace(/[1l]/g,      'i') // i and l are interchangable
    .replace(/0/g,         'o')
    .replace(/9/g,         'q')
    // .replace(/5z/g,        's') // z and s are interchangable
    // .replace(/u/g,         'v') // u and v are interchangable
    .replace(/7/g,         't');
}

function isProfane(str: string) {
  return PROFANITY_FILTER.check(str) || PROFANITY_FILTER.check(deleet(str)) || wordlist.some((word) => {
    return str.includes(word) || deleet(str).includes(word);
  });
  // return PROFANITY_FILTER.isProfane(str) || LEET_PROFANITY_FILTER.isProfane(deleet(str));
}

function removeProfanity(str: string) {
  let i = 0;
  const oldStr = str;
  if (PROFANITY_FILTER.check(str)) {
    const blockedWord = PROFANITY_FILTER.clean(str).split('').map((char, index) => {
      if (char !== '*') return '';
      return oldStr[index];
    }).join('');
    console.log(`DEBUG: blocked username: ${str} contains: ${blockedWord}`);
  } else if (PROFANITY_FILTER.check(deleet(str))) {
    const blockedWord = PROFANITY_FILTER.clean(str).split('').map((char, index) => {
      if (char !== '*') return '';
      return oldStr[index];
    }).join('');
    console.log(`DEBUG: blocked username: ${str} contains: ${blockedWord}`);
  } else {
    for (const word of PROFANITY_FILTER.list()) {
      if (str.includes(word)) {
        console.log(`DEBUG: blocked username: ${str} contains: ${word}`);
        break;
      }
    }
  }
  loop:
  while (isProfane(str)) {
    if (i++ > 100) {
      console.log('DEBUG: overflow');
      return null;
    }
    if (PROFANITY_FILTER.check(str)) {
      str = PROFANITY_FILTER.clean(str).split('').map((char, index) => {
        if (char !== '*') return char;
        if (CHARS_UPPER.includes(oldStr[index])) return CHARS_UPPER[Math.floor(Math.random()*CHARS_UPPER.length)];
        if (CHARS_LOWER.includes(oldStr[index])) return CHARS_LOWER[Math.floor(Math.random()*CHARS_LOWER.length)];
        if (CHARS_NUM.includes(oldStr[index])) return CHARS_NUM[Math.floor(Math.random()*CHARS_NUM.length)];
        return CHARS_ALL[Math.floor(Math.random()*CHARS_ALL.length)];
      }).join('');
    } if (str !== deleet(str) && PROFANITY_FILTER.check(deleet(str))) {
      str = PROFANITY_FILTER.clean(deleet(str)).split('').map((char, index) => {
        if (char !== '*') return char;
        if (CHARS_UPPER.includes(oldStr[index])) return CHARS_UPPER[Math.floor(Math.random()*CHARS_UPPER.length)];
        if (CHARS_LOWER.includes(oldStr[index])) return CHARS_LOWER[Math.floor(Math.random()*CHARS_LOWER.length)];
        if (CHARS_NUM.includes(oldStr[index])) return CHARS_NUM[Math.floor(Math.random()*CHARS_NUM.length)];
        return CHARS_ALL[Math.floor(Math.random()*CHARS_ALL.length)];
      }).join('');
    } else {
      for (const word of PROFANITY_FILTER.list()) {
        let start = -1;
        if (str.includes(word)) {
          start = str.indexOf(word);
        } else if (deleet(str).includes(word)) {
          start = deleet(str).indexOf(word);
        }
        if (start !== -1) {
          str = str.replace(word, '*'.repeat(word.length));
          str = str.split('').map((char, index) => {
            if (char !== '*') return char;
            if (CHARS_UPPER.includes(oldStr[index])) return CHARS_UPPER[Math.floor(Math.random()*CHARS_UPPER.length)];
            if (CHARS_LOWER.includes(oldStr[index])) return CHARS_LOWER[Math.floor(Math.random()*CHARS_LOWER.length)];
            if (CHARS_NUM.includes(oldStr[index])) return CHARS_NUM[Math.floor(Math.random()*CHARS_NUM.length)];
            return CHARS_ALL[Math.floor(Math.random()*CHARS_ALL.length)];
          }).join('');
          continue loop;
        }
      }
    }
  }
  console.log(`DEBUG: username ${oldStr} censored to ${str}`);
  return str;
}

function parseBadges(badgesTag: string, msg: IRC.TwitchMessage) {
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
          const monthCount = parseInt(msg.tags['msg-param-cumulative-months']);
          data.channel = CHANNEL_BADGE.SUBSCRIBER_0;
          if (monthCount >= 3) data.channel = CHANNEL_BADGE.SUBSCRIBER_3;
          if (monthCount >= 6) data.channel = CHANNEL_BADGE.SUBSCRIBER_6;
          if (monthCount >= 12) data.channel = CHANNEL_BADGE.SUBSCRIBER_12;
          if (monthCount >= 24) data.channel = CHANNEL_BADGE.SUBSCRIBER_24;
          if (monthCount >= 36) data.channel = CHANNEL_BADGE.SUBSCRIBER_36;
          if (monthCount >= 48) data.channel = CHANNEL_BADGE.SUBSCRIBER_48;
          if (monthCount >= 60) data.channel = CHANNEL_BADGE.SUBSCRIBER_60;
          if (monthCount >= 120) data.channel = CHANNEL_BADGE.SUBSCRIBER_120;
          // const sublevel = parseInt(level);
          // if (sublevel < 1000) {
          //   data.channel = CHANNEL_BADGE.SUBSCRIBER_TIER_1;
          // } else if (sublevel < 2000) {
          //   data.channel = CHANNEL_BADGE.SUBSCRIBER_TIER_2;
          // } else {
          //   data.channel = CHANNEL_BADGE.SUBSCRIBER_TIER_3;
          // }
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
  let options: IRC.TwitchOptions & IRC.IRCOptions = {
    ...IRC.TwitchClient.CONFIG_SSL_IRC,
    preConnectCommands: [
      IRC.TwitchClient.CAP_ALL
    ],
    nickname: IRC.TwitchClient.generateNickname(),
    autoReconnect: true
  };
  const username = CONFIG.getOption('twitch_username');
  const oauth = CONFIG.getOption('twitch_oauth');
  if (username !== '' || oauth !== '') {
    if (username === '' || oauth === '') {
      console.log('This requires both a username and oauth token for twitch');
      process.exit(1);
    }
    options.nickname = username;
    options.oauth = oauth;
  }
  const client = new IRC.TwitchClient(options);
  client.on('message', (msg: IRC.TwitchMessage) => {
    if (msg.command === 'NOTICE' && msg.parameters[1].includes('Login authentication failed')) {
      console.log(msg.raw);
      process.exit(1);
    }
  });
  client.on('ready', async () => {
    await client.join(TARGET_CHANNEL);
    client.on('message', (msg) => {
      if (msg.command === 'PRIVMSG' && msg.channel === TARGET_CHANNEL) {
        let name = handleUsername(msg.tags['display-name'], msg.prefix.nickname);
        let bad_words = false;
        if (name === null) return; // console.log('Unencodable Name');
        if (DISABLE_FILTER || MSGREGEX.test(msg.message.replaceAll(STRIP_PUNCTUATION, ''))) {
          if (isProfane(name)) {
            name = removeProfanity(name);
            if (name === null) return;
            bad_words = true;
          }
          const badges = parseBadges((msg.tags as any).badges, msg);
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
