FROM node:20-alpine

WORKDIR /app

# Copy package manifests and prisma schema
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm install

# Copy source code and config
COPY . .

# Build TypeScript and generate Prisma Client
RUN npm run build

ENV PORT=10000
ENV NODE_ENV=production
ENV DATABASE_URL=file:./prisma/dev.db
ENV CLIENT_URL=*

EXPOSE 10000

CMD ["npm", "start"]
