FROM node:latest

RUN mkdir -p /usr/src/uwu
WORKDIR /usr/src/uwu

COPY package.json /usr/src/uwu
RUN apt-get update
RUN apt-get install -y build-essential
RUN npm install --build-from-source

RUN npm install -g typescript@4.6.3

COPY . /usr/src/uwu

RUN npx prisma generate

# Build the bot
RUN tsc

# Start the bot.
CMD ["node", "build/index.js"]
