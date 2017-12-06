import { SlackController, SlackBot, SlackMessage } from 'botkit';

import * as querystring from 'querystring';
import * as iconv from 'iconv-lite';
import OriginalZip from '../plantuml/zip/OriginalZip'
import OriginalEncoder from '../plantuml/encode/OriginalEncoder'

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
        const encoded: string = encodeURIComponent(messageText);
        console.debug('encode:' + encoded);
        const decoded: string = querystring.unescape(encoded);
        const charsetConverted = iconv.decode(Buffer.from(decoded, 'UTF-8'), 'ISO-8859-1');
        console.debug('charsetConverted:' + charsetConverted);
        let deflated: string = new OriginalZip().deflate(charsetConverted, 9);
        console.debug('deflated:' + deflated);
        const encoder = new OriginalEncoder();
        const result: string = encoder.encode64(deflated);
        console.debug('result:' + result);

        return result;
    }

}

