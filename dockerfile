FROM node:18-alpine

WORKDIR /app 

RUN npm install express pg

COPY . .

 
EXPOSE 3000

CMD ["node", "backend.js"]
