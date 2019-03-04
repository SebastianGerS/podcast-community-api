# Use a lighter version of Node as a parent image
FROM mhart/alpine-node:11
# Set the working directory to /api
WORKDIR /api
# copy package.json into the container at /api
COPY package*.json /api/
# install dependencies
RUN yarn
# Copy the current directory contents into the container at /api
COPY . /api/
# declare a env variable that can be set from the docker-compose file
ENV PORT=3000
# Make the port available to the world outside this container
EXPOSE $PORT
# Run the app when the container launches
CMD ["yarn", "start"]