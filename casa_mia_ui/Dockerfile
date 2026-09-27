FROM node:20-alpine AS build
WORKDIR /app
COPY frontend/ .
RUN npm install && npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=build /app/dist ./ui
COPY run.sh ./
RUN npm install -g serve
CMD [ "./run.sh" ]