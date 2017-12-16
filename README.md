# Slack PlantUML Bot

## Latest integration

+ TODO CI Service seal

## What's this

Slack上でPlantUMLの記述を行えば画像を返してくれるボット。

## Usage

### npm build & node run

```bash
# build
npm install && npm run build
# execute
SLACK_BOT_TOKEN=[your slack bot token] node ./build/bunld.js
```

### Docker image build & run container

```bash
# build
npm run docker-builds
# execute
docker run -d --rm -e SLACK_BOT_TOKEN=[your slack bot token] kazuhito/slack-plantuml-bot
```

## 参考

[こちら](./doc/REFERENCE_PUBS.md)

## Author

+ [kazuhito_m](https://twitter.com/kazuhito_m)