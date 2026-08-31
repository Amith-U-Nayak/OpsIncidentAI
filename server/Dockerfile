# STEP 1: Choose the base environment
# We use Node 20 on an Alpine Linux distribution (Alpine is incredibly lightweight/small)
FROM node:20-alpine

# STEP 2: Set the working directory inside the container
# This is like saying "cd /app" inside the Linux container
WORKDIR /app

# STEP 3: Copy only the package.json files first
# We do this first for "caching". If your dependencies don't change, 
# Docker skips running 'npm install' on future builds to save time!
COPY package*.json ./

# STEP 4: Install dependencies
RUN npm install --legacy-peer-deps --production

# STEP 5: Copy the rest of your application code into the container
COPY . .

# STEP 6: Expose the port your app runs on
EXPOSE 5000

# STEP 7: Define the command to start the app when the container boots up
# We use 'node src/app.js' instead of 'nodemon' because this is a production container
CMD ["npm", "start"]
