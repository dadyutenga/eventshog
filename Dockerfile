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

# Create a startup script to download certificate at runtime
RUN echo '#!/bin/sh' > /usr/src/app/start.sh && \
    echo 'if [ -n "$CERT_URL" ]; then' >> /usr/src/app/start.sh && \
    echo '    echo "Downloading certificate from: $CERT_URL"' >> /usr/src/app/start.sh && \
    echo '    wget -O /usr/src/app/all-apps-analytics-ca-certificate.crt "$CERT_URL"' >> /usr/src/app/start.sh && \
    echo '    echo "Certificate downloaded. File size:"' >> /usr/src/app/start.sh && \
    echo '    ls -la /usr/src/app/all-apps-analytics-ca-certificate.crt' >> /usr/src/app/start.sh && \
    echo 'else' >> /usr/src/app/start.sh && \
    echo '    echo "Warning: CERT_URL not provided, certificate not downloaded"' >> /usr/src/app/start.sh && \
    echo 'fi' >> /usr/src/app/start.sh && \
    echo 'exec node dist/main' >> /usr/src/app/start.sh && \
    chmod +x /usr/src/app/start.sh

CMD ["/usr/src/app/start.sh"]