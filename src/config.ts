import { SimpleINI } from "./SimpleINI";

export const CONFIG = new SimpleINI(process.env.SIMPLE_INI_CONFIG ?? 'config.ini');

CONFIG.registerOption('channel', {
  default: '#themas3212',
  description: 'Target Channel on Twitch'
});
CONFIG.registerOption('keywords', {
  default: '<3;VirtualHug;FrankerZ;PogChamp',
  description: 'Keywords to filter for in messages'
});
CONFIG.registerOption('disable_filter', {
  default: 'false',
  description: 'Disable the keyword filter and pass all messages'
});

CONFIG.registerOption('udp_socket_server', {
  host: {
    default: '127.0.0.1',
    description: 'Host address to bind udp socket server to'
  },
  port: {
    default: '42000',
    description: 'Port to bind udp socket server to'
  }
});

if (require.main === module) {
  console.log(CONFIG.generateDefaultConfig());
}