import * as Botkit from 'botkit';
import { SlackController } from 'botkit';

import PlantUmlTextWritedEvent from './event/PlantUmlTextWritedEvent';

export default class Bot {
    /** コンストラクタ。 */
    public constructor() {
    }
    /** プログラムのエントリーポイント。 */
    public run() {
        const botToken = process.env.SLACK_BOT_TOKEN;
        if (!botToken) {
            console.log('Error: Specify SLACK_BOT_TOKEN in environment');
            process.exit(1);
        }
        const controller: SlackController = Botkit.slackbot({
            debug: true
        });
        controller.spawn({
            token: botToken as string
        }).startRTM();

        // イベント登録。
        new PlantUmlTextWritedEvent(controller).register();
    }

}

