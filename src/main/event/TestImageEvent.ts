import { SlackController } from 'botkit';

export default class TestImageEvent {

    private readonly controller: SlackController;

    public constructor(controller: SlackController) {
        this.controller = controller;
    }

    public register() {
        const controller: SlackController = this.controller;
        controller.hears(['image', 'im'], 'direct_message,direct_mention,mention', (bot: any, message: any) => {
            const fs = require('fs');
            bot.api.files.upload({
                file: fs.createReadStream('./5000tyouen01.png'),
                filename: 'hoge.png',
                channels: message.channel
            }, function (err: any, res: any) {
                if (err) console.log(err + ',' + res);
            })
        });
    }

}

