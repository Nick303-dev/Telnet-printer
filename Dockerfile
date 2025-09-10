# Docker has specific installation instructions for each operating system.
# Please refer to the official documentation at https://docker.com/get-started/

# Pull the Node.js Docker image:
FROM node:22-alpine

# Create a Node.js container and start a Shell session:
WORKDIR /Telnet-printer

RUN npm installation
COPY . .
EXPOSE 3000
CMD ["node", "server.js"]
