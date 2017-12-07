import PlantUmlServerUrl from '../../main/plantuml/PlantUmlServerUrl';

describe('PlantUMLサイトのURLを作成するテスト', () => {
    let sut: PlantUmlServerUrl;

    describe('generate()のテスト', () => {
        test('指定した「PlantUMLのUML構文」から、サーバに図形を要求するURLを作成できる。', () => {
            const parameter: string = "@startuml\nclass test\n@enduml";

            const actual = new PlantUmlServerUrl(parameter).generate();

            const expected = 'SoWkIImgAStDuKhEIImkLdWsVUcpEMjUh9h7vP2Qbm8K1m00';
            expect(actual).toContain(expected);
        })
    });

});

