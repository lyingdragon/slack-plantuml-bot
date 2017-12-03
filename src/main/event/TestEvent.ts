import { SlackController } from 'botkit';

export default class TestTestEvent {

    private controller: SlackController;

    public constructor(controller: SlackController) {
        this.controller = controller;
    }

    public registerEvent() {
        const controller: SlackController = this.controller;
        controller.hears(['hello', 'hi', 'おれ'], 'direct_message,direct_mention,mention', (bot: any, message: any) => {
            controller.storage.users.get(message.user, (err: any, user: any) => {
                console.error('error:' + err);
                if (user && user.name) {
                    bot.reply(message, 'Hello ' + user.name + '!!');
                } else {
                    bot.reply(message, '…' + message.text + 'ですか。');
                    bot.reply(message, '諦めたらそこで試合終了ですよ。');
                }
            });
        });
    }

}

