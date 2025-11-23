FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./
COPY .eslintrc.js ./
COPY .prettierrc ./

# Install dependencies
RUN npm install

# Copy source code
COPY prisma ./prisma
COPY src ./src

# Expose port
EXPOSE 3000

# Start command will be in docker-compose
CMD ["npm", "run", "dev"]
