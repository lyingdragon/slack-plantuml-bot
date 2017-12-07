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
        const encoded = encodeURIComponent(this.umlText);
        const decoded = querystring.unescape(encoded);

        const charsetConverted = iconv.decode(Buffer.from(decoded, 'UTF-8'), 'ISO-8859-1');

        const deflated = new OriginalZip().deflate(charsetConverted, 9);

        const result = new OriginalEncoder().encode64(deflated);

        return PlantUmlServerUrl.URL_HEAD + result;
    }

}