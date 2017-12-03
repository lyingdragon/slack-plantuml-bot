import * as Botkit from 'botkit';
import { SlackController } from 'botkit';

import TestEvent from './event/TestEvent';
import TestImageEvent from './event/TestImageEvent';

export default class Bot {
    /** コンストラクタ。 */
    public constructor() {
    }
    /** プログラムのエントリーポイント。 */
    public run() {
        const botToken: any = process.env.token;
        if (!botToken) {
            console.log('Error: Specify token in environment');
            process.exit(1);
        }
        const controller: SlackController = Botkit.slackbot({
            debug: true
        });
        controller.spawn({
            token: botToken
        }).startRTM();

        // イベント登録。
        new TestEvent(controller).registerEvent();
        new TestImageEvent(controller).registerEvent();
    }

}

