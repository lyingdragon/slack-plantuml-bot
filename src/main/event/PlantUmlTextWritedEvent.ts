import { SlackController, SlackBot, SlackMessage } from 'botkit';
import PlantUmlServerUrl from '../plantuml/PlantUmlServerUrl'

export default class PlantUmlTextWritedEvent {
    private readonly controller: SlackController;
    private buffer: string;
    private flag: boolean;

    public constructor(controller: SlackController) {
        this.controller = controller;
        this.clearBuffer();
    }

    public register() {
        const controller: SlackController = this.controller;
        controller.hears([/.*/], 'direct_message,direct_mention,mention', this.messageAnalyzeAndReply);
        controller.hears([/@startuml/i], 'ambient', this.messageStart);
        //lyigdragon
        controller.hears([/@enduml/i], 'ambient', this.messageEnd);
        controller.hears([/^@add/i], 'ambient', this.messageAdd);
        controller.hears([/^@showuml/i], 'ambient', this.messageAnalyzeAndReply);
        controller.hears([/^@showdata/i], 'ambient', this.messageShowData);
    }

    private clearBuffer() {
      this.buffer = '';
      this.flag = false;
    }

    private messageAnalyzeAndReply = (bot: SlackBot, message: SlackMessage) => {
        //if (message.text == undefined) return;
        if( this.buffer == '') {
          bot.reply(message, 'no data');
        }
        else {
          //const replyUrl = this.umlUrl(message.text);
          const replyUrl = this.umlUrl(this.buffer);
          if (replyUrl.length == 0) return;
          bot.reply(message, replyUrl);
        }
    }

    private messageStart = (bot: SlackBot, message: SlackMessage) => {
        if (message.text == undefined) return;

        if( this.flag ) {      // if it's already stared, clear buffer and start again
          this.clearBuffer();
        }
        this.flag = true;
        this.buffer += message.text + '\n';
        bot.reply(message, 'Started...');
    }

    private messageAdd = (bot: SlackBot, message: SlackMessage) => {
        if (message.text == undefined) return;
        if (this.flag) {
          this.buffer += message.text.replace('@add', '') + '\n';
        }
        bot.reply(message, 'Got it');
    }

    private messageShowData = (bot: SlackBot, message: SlackMessage) => {
        if (message.text == undefined) return;
        if( this.buffer == '') {
          bot.reply(message, 'no data');
        } else {
          bot.reply(message, this.buffer);
        }
    }

    private messageEnd = (bot: SlackBot, message: SlackMessage) => {
        this.messageAnalyzeAndReply(bot, message);
        this.clearBuffer();
    }

    private umlUrl(messageText: string): string {
        return new PlantUmlServerUrl(messageText).generate();
    }
}
