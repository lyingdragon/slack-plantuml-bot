import OriginalEncoder from '../../../main/plantuml/encode/OriginalEncoder';

describe('Encoder(PlantUMLサイトで使ってるライブラリ)のテスト', () => {
    let sut: OriginalEncoder;

    beforeEach(() => {
        sut = new OriginalEncoder();
    });

    describe('encode64のテスト', () => {
        test('ISO-8859-1キャラクタセットの文字列をエンコードし、期待通りの文字列へと変換する。', () => {
            const parameter: string = "s(.I,*)ÍÍáJÎI,.Vx6}é³9k^¬Çå";

            const actual = sut.encode64(parameter);

            const expected = `SoWkIImgAStDuKhEIImkLdWsVUcpEMjUh9h7vP2Qbm8K1m00`;
            expect(actual).toContain(expected);
        })
    });

});

