FROM node:11.15.0
WORKDIR /srv
COPY package.json ./package.json
COPY node_modules ./node_modules
COPY dist ./dist 

ENV PORT=9000

EXPOSE $PORT
CMD ["node", "dist/server/src/index.js"]