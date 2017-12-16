import * as querystring from 'querystring';
import * as iconv from 'iconv-lite';
import OriginalZip from './zip/OriginalZip'
import OriginalEncoder from './encode/OriginalEncoder'

export default class PlantUmlServerUrl {

    private static readonly URL_HEAD = 'http://www.plantuml.com/plantuml/png/';

    private readonly umlText: string;

    public constructor(umlText: string) {
        this.umlText = umlText;
    }

    public generate(): string {
        const normalizedText: string = this.normalize();
        if (normalizedText.length === 0) return '';

        const fixdUmlText = "@startuml\n" + normalizedText + "\n@enduml";

        const encoded = encodeURIComponent(fixdUmlText);
        const decoded = querystring.unescape(encoded);

        const charsetConverted = iconv.decode(Buffer.from(decoded, 'UTF-8'), 'ISO-8859-1');

        const deflated = new OriginalZip().deflate(charsetConverted, 9);

        const result = new OriginalEncoder().encode64(deflated);

        return PlantUmlServerUrl.URL_HEAD + result;
    }

    normalize(): string {
        const trimed = this.umlText.trim();
        if (trimed.length === 0) return '';
        const crEscape = trimed.replace(/\n/g, '<cr>');
        const frontCut = crEscape.replace(/^.*@startuml/i, '').trimLeft();
        const endCut = frontCut.replace(/@enduml.*$/i, '').trimRight();
        const removeCodeGraph = endCut.replace(/```/g, '');
        const crTrimed = removeCodeGraph.replace(/^(<cr>)*/, '').replace(/(<cr>)*$/, '');
        const crRecoverd = crTrimed.replace(/<cr>/g, "\n");
        return crRecoverd.trim();
    }

}