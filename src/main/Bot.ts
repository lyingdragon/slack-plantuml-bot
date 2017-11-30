import * as Botkit from 'botkit';
import { SlackController } from 'botkit';

export default class Bot {
    /** コンストラクタ。 */
    public constructor() {
    }
    /** プログラムのエントリーポイント。 */
    public run() {
        const botToken:any = process.env.token;
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

        controller.hears(['hello', 'hi', 'おれ'], 'direct_message,direct_mention,mention', (bot: any, message: any) => {
            controller.storage.users.get(message.user, (err: any, user: any) => {
                console.error('error:' + err);
                if (user && user.name) {
                        bot.reply(message, 'Hello ' + user.name + '!!');
                } else {
                    bot.reply(message, '諦めたらそこで試合終了ですよ。');
                }
            });
        });
    }

}

