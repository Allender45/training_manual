import { Telegraf } from 'telegraf';
import { SocksProxyAgent } from 'socks-proxy-agent';
import { BOT_TOKEN } from './config';
import { BotContext } from './middlewares/resolveUser';

const agent = process.env.TELEGRAM_SOCKS_PROXY
    ? new SocksProxyAgent(process.env.TELEGRAM_SOCKS_PROXY)
    : undefined;

export const bot = new Telegraf<BotContext>(BOT_TOKEN, agent ? { telegram: { agent } } : undefined);