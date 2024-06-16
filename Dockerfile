FROM node:18.20.2
WORKDIR /photoco_server
COPY package.json .
RUN npm install
COPY . .

EXPOSE 4000

CMD ["npm", "start"]
