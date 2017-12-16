FROM node:9

MAINTAINER kazuhito-m

RUN git clone https://github.com/kazuhito-m/slack-plantuml-bot.git /tmp/slack-plantuml-bot

# build & cleanup
RUN cd /tmp/slack-plantuml-bot && \
    npm install && \
    npm test && \
    npm run build && \
    mv ./build/bundle.js /usr/local/bin/slack-plantuml-bot.js && \
    rm -rf /tmp/* /root/.npm/

CMD ["node", "/usr/local/bin/slack-plantuml-bot.js"]
