import { BotModule } from './modules/types';
import { eventsModule } from './modules/events';
import { hrModule } from './modules/hr';
import { newsModule } from './modules/news';
import { supportModule } from './modules/support';

export const modules: BotModule[] = [
    eventsModule,
    hrModule,
    newsModule,
    supportModule
];