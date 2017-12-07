import PlantUmlServerUrl from '../../main/plantuml/PlantUmlServerUrl';

describe('PlantUMLサイトのURLを作成するテスト', () => {
    let sut: PlantUmlServerUrl;

    describe('generate()のテスト', () => {
        test('指定した「PlantUMLのUML構文」から、サーバに図形を要求するURLを作成できる。', () => {
            const parameter: string = "@startuml\nclass 日本語\n@enduml";

            const actual = new PlantUmlServerUrl(parameter).generate();

            const expected = 'http://www.plantuml.com/plantuml/png/SoWkIImgAStDuKhEIImkLdWsVUcpEMjUh9h7vP2Qbm8K1m00';
            expect(actual).toContain(expected);
        })
    });

});

