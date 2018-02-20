import PlantUmlServerUrl from '../plantuml/PlantUmlServerUrl';
var PlantUmlTextWritedEvent = (function () {
    function PlantUmlTextWritedEvent(controller) {
        var _this = this;
        this.messageAnalyzeAndReply = function (bot, message) {
            if (message.text == undefined)
                return;
            var replyUrl = _this.umlUrl(message.text);
            if (replyUrl.length == 0)
                return;
            bot.reply(message, replyUrl);
        };
        this.controller = controller;
    }
    PlantUmlTextWritedEvent.prototype.register = function () {
        var controller = this.controller;
        controller.hears([/.*/], 'direct_message,direct_mention,mention', this.messageAnalyzeAndReply);
        controller.hears([/@startuml/i], 'ambient', this.messageAnalyzeAndReply);
    };
    PlantUmlTextWritedEvent.prototype.umlUrl = function (messageText) {
        return new PlantUmlServerUrl(messageText).generate();
    };
    return PlantUmlTextWritedEvent;
}());
export default PlantUmlTextWritedEvent;
//# sourceMappingURL=PlantUmlTextWritedEvent.js.map