FROM mhart/alpine-node:0.10.38

MAINTAINER nearForm <info@nearform.com>

RUN apk add --update git make gcc g++ python

RUN mkdir -p /usr/src/app /usr/src/lib /usr/src/web /usr/src/tasks
WORKDIR /usr/src/app

COPY package.json /usr/src/app/
COPY lib /usr/src/app/lib/
COPY web /usr/src/app/web/
COPY *.js /usr/src/app/
RUN npm install
RUN npm run gulp

RUN apk del make gcc g++ python && rm -rf /tmp/* /root/.npm /root/.node-gyp

VOLUME ["/usr/src/app/public"]

EXPOSE 8000

EXPOSE 10301
EXPOSE 10302
EXPOSE 10303
EXPOSE 10304
EXPOSE 10305
EXPOSE 10306

CMD ["node", "service.js"]
