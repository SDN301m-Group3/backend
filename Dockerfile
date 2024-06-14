FROM node:18.20.2
WORKDIR /app
COPY package.json .
RUN npm install
COPY . .

EXPOSE 4500

CMD ["npm", "start"]
