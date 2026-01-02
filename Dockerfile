FROM node:latest

WORKDIR /app

COPY . .
RUN npm install

# Set environment variables for build
ARG PUBLIC_BETTER_AUTH_URL=http://localhost:3000
ARG BETTER_AUTH_SECRET=dev-secret-key-change-in-production
ARG DATABASE_URL=postgresql://user:password@localhost/db

ENV PUBLIC_BETTER_AUTH_URL=${PUBLIC_BETTER_AUTH_URL}
ENV BETTER_AUTH_SECRET=${BETTER_AUTH_SECRET}
ENV DATABASE_URL=${DATABASE_URL}

RUN npm run build

CMD node build
EXPOSE 80