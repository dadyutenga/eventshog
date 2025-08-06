# Stage 1: build
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

RUN apk add --no-cache python3 make g++ && ln -sf /usr/bin/python3 /usr/bin/python

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Stage 2: production
FROM node:20-alpine

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install --only=production

# Copy built output from builder
COPY --from=builder /usr/src/app/dist ./dist

# Download the certificate from environment variable
ARG CERT_URL
RUN if [ -n "$CERT_URL" ]; then \
        wget -O /usr/src/app/all-apps-analytics-ca-certificate.crt "$CERT_URL"; \
    else \
        echo "Warning: CERT_URL not provided, certificate not downloaded"; \
    fi

CMD ["node", "dist/main"]