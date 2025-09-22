# Usa l'ultima immagine Node
FROM node:latest

# Imposta la working directory
WORKDIR /usr/src/app

# Copia package.json e package-lock.json
COPY package*.json ./

# Installa le dipendenze
RUN npm install --production

# Copia tutto il resto del progetto
COPY . .

# Comando di avvio
CMD ["node", "server.js"]
