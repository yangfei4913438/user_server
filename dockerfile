# build stage
FROM node:lts-alpine as build-stage

WORKDIR /temp

# Copying package files and installing dependencies
COPY package.json package-lock.json .
RUN npm install --registry=https://registry.npmmirror.com/ --frozen-lockfile && \
    npm cache clean --force

# Copying source files and building the application
COPY . .
RUN npm run build

# production stage
FROM node:lts-alpine as production-stage

WORKDIR /app

# Copying only necessary files from build-stage
COPY --from=build-stage /temp/dist ./dist
COPY --from=build-stage /temp/.env ./.env
COPY --from=build-stage /temp/package.json ./package.json
COPY --from=build-stage /temp/package-lock.json ./package-lock.json
COPY --from=build-stage /temp/tsconfig.json ./tsconfig.json

# Installing only production dependencies
RUN npm install --registry=https://registry.npmmirror.com/ --only=production && \
    npm cache clean --force

# Exposing the right port
EXPOSE 3006

# Starting the application
CMD [ "npm", "run", "start:prod" ]