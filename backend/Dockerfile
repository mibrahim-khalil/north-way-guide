FROM node:18

RUN apt-get update && apt-get install -y python3 python3-pip

WORKDIR /app

COPY package*.json ./
RUN npm ci || npm install

COPY ml_service_v2/requirements.txt ./ml_service_v2/requirements.txt
RUN pip3 install --no-cache-dir -r ml_service_v2/requirements.txt

COPY . .

EXPOSE 5000
CMD ["npm", "start"]