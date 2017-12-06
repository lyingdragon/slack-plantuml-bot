import OriginalZip from '../../../main/plantuml/zip/OriginalZip';

describe('Zip(PlantUMLサイトで使ってるライブラリ)のテスト', () => {
    let sut: OriginalZip;

    beforeEach(() => {
        sut = new OriginalZip();
    });

    describe('deflateのテスト', () => {
        test('Ascii文字のみの文字列が圧縮できる', () => {
            const parameter: string = "@startuml\nclass test\n@enduml";

            const actual = sut.deflate(parameter , 9 );

            const expected = `s(.I,*)ÍÍáJÎI,.V(I-.árHÍK`;
            expect(actual).toContain(expected);
        })
    });

});

