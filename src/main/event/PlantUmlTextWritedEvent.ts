import { SlackController, SlackBot, SlackMessage } from 'botkit';
import PlantUmlServerUrl from '../plantuml/PlantUmlServerUrl'

export default class PlantUmlTextWritedEvent {
    private readonly controller: SlackController;

    public constructor(controller: SlackController) {
        this.controller = controller;
    }

    public register() {
        const controller: SlackController = this.controller;
        controller.hears([/.*/], 'direct_message,direct_mention,mention', this.messageAnalyzeAndReply);
        controller.hears([/@startuml/i], 'ambient', this.messageAnalyzeAndReply);
    }

    private messageAnalyzeAndReply = (bot: SlackBot, message: SlackMessage) => {
        if (message.text == undefined) return;
        const replyUrl = this.umlUrl(message.text);
        if (replyUrl.length == 0) return;
        bot.reply(message, replyUrl);
    }

    private umlUrl(messageText: string): string {
        return new PlantUmlServerUrl(messageText).generate();
    }

}