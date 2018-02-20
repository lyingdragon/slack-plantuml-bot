import * as querystring from 'querystring';
import * as iconv from 'iconv-lite';
import OriginalZip from './zip/OriginalZip';
import OriginalEncoder from './encode/OriginalEncoder';
var PlantUmlServerUrl = (function () {
    function PlantUmlServerUrl(umlText) {
        this.umlText = umlText;
    }
    PlantUmlServerUrl.prototype.generate = function () {
        var normalizedText = this.normalize();
        if (normalizedText.length === 0)
            return '';
        var fixdUmlText = "@startuml\n" + normalizedText + "\n@enduml";
        var encoded = encodeURIComponent(fixdUmlText);
        var decoded = querystring.unescape(encoded);
        var charsetConverted = iconv.decode(Buffer.from(decoded, 'UTF-8'), 'ISO-8859-1');
        var deflated = new OriginalZip().deflate(charsetConverted, 9);
        var result = new OriginalEncoder().encode64(deflated);
        return PlantUmlServerUrl.URL_HEAD + result;
    };
    PlantUmlServerUrl.prototype.normalize = function () {
        var trimed = this.umlText.trim();
        if (trimed.length === 0)
            return '';
        var removeSc = trimed.replace(/&lt;/g, '<').replace(/&gt;/g, '>');
        var crEscape = removeSc.replace(/\n/g, '<cr>');
        var frontCut = crEscape.replace(/^.*@startuml/i, '').trimLeft();
        var endCut = frontCut.replace(/@enduml.*$/i, '').trimRight();
        var removeCodeGraph = endCut.replace(/```/g, '');
        var crTrimed = removeCodeGraph.replace(/^(<cr>)*/, '').replace(/(<cr>)*$/, '');
        var crRecoverd = crTrimed.replace(/<cr>/g, "\n");
        return crRecoverd.trim();
    };
    PlantUmlServerUrl.URL_HEAD = 'http://www.plantuml.com/plantuml/png/';
    return PlantUmlServerUrl;
}());
export default PlantUmlServerUrl;
//# sourceMappingURL=PlantUmlServerUrl.js.map