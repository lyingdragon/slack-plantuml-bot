import PlantUmlServerUrl from '../../main/plantuml/PlantUmlServerUrl';
describe('PlantUMLサイトのURLを作成するテスト', function () {
    describe('generate()のテスト', function () {
        test('指定した「PlantUMLのUML構文」から、サーバに図形を要求するURLを作成できる。', function () {
            var parameter = "@startuml\nclass 日本語\n@enduml";
            var actual = new PlantUmlServerUrl(parameter).generate();
            var expected = 'http://www.plantuml.com/plantuml/png/SoWkIImgAStDuKhEIImkLdWsVUcpEMjUh9h7vP2Qbm8K1m00';
            expect(actual).toContain(expected);
        });
    });
    describe('nomarize()のテスト', function () {
        test('両脇のUML宣言があった場合、削除する', function () {
            var parameter = "@startuml\nclass 日本語\n@enduml";
            var actual = new PlantUmlServerUrl(parameter).normalize();
            expect(actual).toEqual('class 日本語');
        });
        test('前にUML宣言があり、その前にも文字列があった場合、削除する', function () {
            var parameter = "前にある不必要と思しき文字列\n@startuml\nclass 日本語";
            var actual = new PlantUmlServerUrl(parameter).normalize();
            expect(actual).toEqual('class 日本語');
        });
        test('後ろにUML宣言があり、その後にも文字列があった場合、削除する', function () {
            var parameter = "class 日本語@enduml\n後ろにある不必要と思しき文字列";
            var actual = new PlantUmlServerUrl(parameter).normalize();
            expect(actual).toEqual('class 日本語');
        });
        test('空白やタブで作られている文字列は、空文字に変換する', function () {
            var parameter = " \t \t";
            var actual = new PlantUmlServerUrl(parameter).normalize();
            expect(actual).toEqual('');
        });
        test('空白と、前後に改行が連打されていたとしても、空文字に変換する', function () {
            var parameter = "\n\n\n  \n\n\n";
            var actual = new PlantUmlServerUrl(parameter).normalize();
            expect(actual).toEqual('');
        });
        test('UML宣言に大文字小文字が混在していたとしても、削除する', function () {
            var parameter = "前\n@StArTuMl\n\n\nclass Test\n\n@eNdUmL\n後";
            var actual = new PlantUmlServerUrl(parameter).normalize();
            expect(actual).toEqual("class Test");
        });
        test('二行以上からなるUMLテキストはそのままとなる', function () {
            var parameter = "class Test\nclass Bar";
            var actual = new PlantUmlServerUrl(parameter).normalize();
            expect(actual).toEqual("class Test\nclass Bar");
        });
        test('Slack上のコード表現を除去して文字列と認識する', function () {
            var parameter = "```class Test {\n  - fielad\n  + method()\n}\nTest -- Parent```";
            var actual = new PlantUmlServerUrl(parameter).normalize();
            expect(actual).toEqual("class Test {\n  - fielad\n  + method()\n}\nTest -- Parent");
        });
        test('Slack上で「スペシャルキャラクタに変換されて送られてくる」ものは、復号する', function () {
            var parameter = "Figure &lt;|- Rect : 汎化\nRect -|&gt; Parent";
            var actual = new PlantUmlServerUrl(parameter).normalize();
            expect(actual).toEqual("Figure <|- Rect : 汎化\nRect -|> Parent");
        });
    });
});
//# sourceMappingURL=PlantUmlServerUrlTest.js.map