export const STATUS_BADGES = [
  'staff',
  'broadcaster',          // 1
  'moderator',            // 1
  'vip',                  // 1

];
export enum STATUS_BADGE {
  NO_BADGE,
  STAFF,
  BROADCASTER,
  MODERATOR,
  VIP,
}
export const STATUS_LOOKUP = {
  'staff': STATUS_BADGE.STAFF,
  'broadcaster': STATUS_BADGE.BROADCASTER,
  'moderator': STATUS_BADGE.MODERATOR,
  'vip': STATUS_BADGE.VIP
};

export const GLOBAL_BADGES = [
  'ambassador',
  'bits-charity',
  'clip-champ',
  'extension',
  'glhf-pledge',
  'glitchcon2020',
  'partner',
  'premium',
  'turbo',
  'twitchbot',
  'twitchcon2017',
  'twitchcon2018',
  'twitchconAmsterdam2020',
  'twitchconEU2019',
  'twitchconNA2019',
  'twitchconNA2020',
  'user-anniversary',
  'bits',
  'sub-gifter',
  'hype-train',
  'bits-leader',
  'sub-gift-leader'
];
export enum GLOBAL_BADGE {
  NO_BADGE,
  // AMBASSADOR,
  BITS_CHARITY,
  // CLIP_CHAMP,
  // EXTENSION,
  GLHF_PLEDGE,
  GLITCHCON2020,
  PARTNER,
  PREMIUM,
  TURBO,
  // TWITCHBOT,
  TWITCHCON_2017,
  TWITCHCON_2018,
  TWITCHCON_AMSTERDAM2020,
  TWITCHCON_EU2019,
  TWITCHCON_NA2019,
  TWITCHCON_NA2020,
  // USER_ANNIVERSARY,
  BITS_1,
  BITS_100,
  BITS_1000,
  BITS_5000,
  BITS_10000,
  // BITS_25000,
  // BITS_50000,
  // BITS_75000,
  // BITS_100000,
  // BITS_200000,
  // BITS_300000,
  // BITS_400000,
  // BITS_500000,
  SUB_GIFT_1,
  SUB_GIFT_5,
  SUB_GIFT_10,
  SUB_GIFT_25,
  SUB_GIFT_50,
  SUB_GIFT_100,
  // SUB_GIFT_250,
  // SUB_GIFT_500,
  // SUB_GIFT_1000,
  HYPETRAIN_1,
  HYPETRAIN_2,
  BITS_LEADER_FIRST,
  BITS_LEADER_SECOND,
  BITS_LEADER_THIRD,
  SUB_GIFT_LEADER_FIRST,
  SUB_GIFT_LEADER_SECOND,
  SUB_GIFT_LEADER_THIRD
}
export const GLOBAL_LOOKUP = {
  // 'ambassador': GLOBAL_BADGE.AMBASSADOR,
  'bits-charity': GLOBAL_BADGE.BITS_CHARITY,
  // 'clip-champ': GLOBAL_BADGE.CLIP_CHAMP,
  // 'extension': GLOBAL_BADGE.EXTENSION,
  'glhf-pledge': GLOBAL_BADGE.GLHF_PLEDGE,
  'glitchcon2020': GLOBAL_BADGE.GLITCHCON2020,
  'partner': GLOBAL_BADGE.PARTNER,
  'premium': GLOBAL_BADGE.PREMIUM,
  'turbo': GLOBAL_BADGE.TURBO,
  // 'twitchbot': GLOBAL_BADGE.TWITCHBOT,
  'twitchcon2017': GLOBAL_BADGE.TWITCHCON_2017,
  'twitchcon2018': GLOBAL_BADGE.TWITCHCON_2018,
  'twitchconAmsterdam2020': GLOBAL_BADGE.TWITCHCON_AMSTERDAM2020,
  'twitchconEU2019': GLOBAL_BADGE.TWITCHCON_EU2019,
  'twitchconNA2019': GLOBAL_BADGE.TWITCHCON_NA2019,
  'twitchconNA2020': GLOBAL_BADGE.TWITCHCON_NA2020,
  // 'user-anniversary': GLOBAL_BADGE.USER_ANNIVERSARY
};

export const CHANNEL_BADGES = [
  'subscriber'
];
export enum CHANNEL_BADGE {
  NO_BADGE,
  SUBSCRIBER_TIER_1,
  SUBSCRIBER_TIER_2,
  SUBSCRIBER_TIER_3,
}

export function enumerateEnum(X: any) {
  let i = 0;
  for (const val in X) {
    if (isNaN(parseInt(val))) {
      i++;
      console.log(val, '=', X[val]);
    }
  }
  let j = 0;
  while (i > 2**j) {j++;}
  console.log(i, 'items', j, 'bits');
}

const COLORS = [
    { name: 'Blue', code: 0, r: 0x00, g: 0x00, b: 0xFF },
    { name: 'Coral', code: 1, r: 0xFF, g: 0x7F, b: 0x50 },
    { name: 'DodgerBlue', code: 2, r: 0x1E, g: 0x90, b: 0xFF },
    { name: 'SpringGreen', code: 3, r: 0x00, g: 0xFF, b: 0x7F },
    { name: 'YellowGreen', code: 4, r: 0x9A, g: 0xCD, b: 0x32 },
    { name: 'Green', code: 5, r: 0x00, g: 0x80, b: 0x00 },
    { name: 'OrangeRed', code: 6, r: 0xFF, g: 0x45, b: 0x00 },
    { name: 'Red', code: 7, r: 0xFF, g: 0x00, b: 0x00 },
    { name: 'GoldenRod', code: 8, r: 0xDA, g: 0xA5, b: 0x20 },
    { name: 'HotPink', code: 9, r: 0xFF, g: 0x69, b: 0xB4 },
    { name: 'CadetBlue', code: 0xA, r: 0x5F, g: 0x9E, b: 0xA0 },
    { name: 'SeaGreen', code: 0xB, r: 0x2E, g: 0x8B, b: 0x57 },
    { name: 'Chocolate', code: 0xC, r: 0xD2, g: 0x69, b: 0x1E },
    { name: 'BlueViolet', code: 0xD, r: 0x8A, g: 0x2B, b: 0xE2 },
    { name: 'Firebrick', code: 0xE, r: 0xB2, g: 0x22, b: 0x22 },
    { name: 'White', code: 0xF, r: 0xFF, g: 0xFF, b: 0xFF }
];

function randomInt(max: number) {
  max = max ?? 1;
  if (max < 0) throw new Error();
  return Math.floor(Math.random() * (max + 1));
}

export function encodeColor(hexColor: string): [number, number, number] {
  const red = parseInt(hexColor.slice(1,3), 16);
  const green = parseInt(hexColor.slice(3,5), 16);
  const blue = parseInt(hexColor.slice(5,7), 16);
  return [red, green, blue];
}

export function randomColor(hash: number): [number, number, number] {
  const color = COLORS[hash];
  return [color.r, color.g, color.b];
}
