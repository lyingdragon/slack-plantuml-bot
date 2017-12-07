import { SlackController, SlackBot, SlackMessage } from 'botkit';
import PlantUmlServerUrl from '../plantuml/PlantUmlServerUrl'

export default class EchoEvent {
    private readonly controller: SlackController;

    public constructor(controller: SlackController) {
        this.controller = controller;
    }

    public register() {
        const controller: SlackController = this.controller;
        controller.hears(['.*'], 'direct_message,direct_mention,mention', (bot: SlackBot, message: SlackMessage) => {
            if (message.text == undefined) return bot.reply(message, 'ごめん…無理。');
            bot.reply(message, this.umlUrl(message.text));
        });
    }

    private umlUrl(messageText: string): string {
        return new PlantUmlServerUrl(messageText).generate();
    }

}

