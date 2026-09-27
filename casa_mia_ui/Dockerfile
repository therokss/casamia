FROM node:20-alpine AS build
WORKDIR /app
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY frontend/ .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
RUN npm install -g serve@14 --no-audit --no-fund
COPY --from=build /app/dist ./ui
COPY run.sh ./
RUN chmod +x run.sh
CMD [ "./run.sh" ]
