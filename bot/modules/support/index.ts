import { BotModule } from '../types';

export const supportModule: BotModule = {
    key: 'support',
    title: '🆘 Техподдержка',
    isVisible: () => true,
    register: (bot) => {
        bot.hears('🆘 Техподдержка', async (ctx) => {
            await ctx.scene.enter('support-request');
        });
    },
};