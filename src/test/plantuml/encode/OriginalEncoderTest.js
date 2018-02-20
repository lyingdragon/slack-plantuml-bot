import OriginalEncoder from '../../../main/plantuml/encode/OriginalEncoder';
describe('Encoder(PlantUMLサイトで使ってるライブラリ)のテスト', function () {
    var sut;
    beforeEach(function () {
        sut = new OriginalEncoder();
    });
    describe('encode64のテスト', function () {
        test('ISO-8859-1キャラクタセットの文字列をエンコードし、期待通りの文字列へと変換する。', function () {
            var parameter = "s(.I,*)ÍÍáJÎI,.Vx6}é³9k^¬Çå";
            var actual = sut.encode64(parameter);
            var expected = "SoWkIImgAStDuKhEIImkLdWsVUcpEMjUh9h7vP2Qbm8K1m00";
            expect(actual).toContain(expected);
        });
    });
});
//# sourceMappingURL=OriginalEncoderTest.js.map