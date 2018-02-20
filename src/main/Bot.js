import * as Botkit from 'botkit';
import PlantUmlTextWritedEvent from './event/PlantUmlTextWritedEvent';
var Bot = (function () {
    function Bot() {
    }
    Bot.prototype.run = function () {
        var botToken = process.env.SLACK_BOT_TOKEN;
        if (!botToken) {
            console.log('Error: Specify SLACK_BOT_TOKEN in environment');
            process.exit(1);
        }
        var controller = Botkit.slackbot({
            debug: true
        });
        controller.spawn({
            token: botToken
        }).startRTM();
        new PlantUmlTextWritedEvent(controller).register();
    };
    return Bot;
}());
export default Bot;
//# sourceMappingURL=Bot.js.map