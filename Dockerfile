FROM node:18-alpine

WORKDIR /app

COPY package*.json yarn.lock ./
RUN yarn install --frozen-lockfile

COPY . .
RUN yarn build

EXPOSE 3000
ENV NODE_ENV=production

CMD ["node", "dist/main.js"]