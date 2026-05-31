# Specifies where to get the base image (Node v12 in our case) and creates a new container for it FROM node:12 Change image to pm2
#FROM keymetrics/pm2:14-alpine
# Set working directory. Paths will be relative this WORKDIR.
#WORKDIR /usr/src/app
# Set pm2 ecosystem file
#COPY ecosystem.config.js .
# Install dependencies
#COPY package*.json ./
#RUN npm install
#RUN npm install --quiet

# install CURL
#RUN apk add curl

# Copy source files from host computer to the container
#COPY . .
# Build the app RUN npm run build Specify port app runs on
#EXPOSE 3000
# Run the app CMD [ "nodemon", "server.js" ] CMD [ "npm", "start" ] Replace command cmd to this
#CMD [ "pm2-runtime", "start", "ecosystem.config.js" ]


#-----NEW
FROM node:16

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY ecosystem.config.js .
COPY package*.json ./

RUN npm install
# If you are building your code for production
# RUN npm ci --omit=dev


# Bundle app source
COPY . .

EXPOSE 3000
CMD [ "node", "server.js" ]
