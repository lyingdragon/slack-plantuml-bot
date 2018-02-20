import OriginalZip from '../../../main/plantuml/zip/OriginalZip';
describe('Zip(PlantUMLサイトで使ってるライブラリ)のテスト', function () {
    var sut;
    beforeEach(function () {
        sut = new OriginalZip();
    });
    describe('deflateのテスト', function () {
        test('Ascii文字のみの文字列が圧縮できる', function () {
            var parameter = "@startuml\nclass test\n@enduml";
            var actual = sut.deflate(parameter, 9);
            var expected = "s(.I,*)\u00CD\u00CD\u00E1J\u00CEI,.V(I-.\u00E1rH\u00CDK";
            expect(actual).toContain(expected);
        });
    });
});
//# sourceMappingURL=OriginalZipTest.js.map