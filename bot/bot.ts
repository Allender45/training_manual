import { Telegraf } from 'telegraf';
import { BOT_TOKEN } from './config';
import { BotContext } from './middlewares/resolveUser';

export const bot = new Telegraf<BotContext>(BOT_TOKEN);