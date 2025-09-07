ARG NODE_VERSION=20.11.1
ARG PNPM_VERSION=9.1.2

FROM node:${NODE_VERSION}-alpine AS base

WORKDIR /usr/src/app/soybean/frontend

RUN --mount=type=cache,target=/root/.npm \
    npm install -g pnpm@${PNPM_VERSION}

FROM base AS deps

COPY . .

RUN --mount=type=cache,target=/root/.local/share/pnpm/store/soybean-admin/frontend \
    pnpm install

FROM deps AS build

# Run the build script.
RUN pnpm run build

FROM nginx:stable-alpine AS final

WORKDIR /usr/share/nginx/html

RUN ln -sf /usr/share/zoneinfo/Asia/Shanghai /etc/localtime \
    && echo 'Asia/Shanghai' >/etc/timezone \
    && rm /etc/nginx/nginx.conf

COPY nginx.conf /etc/nginx/nginx.conf

COPY --from=build /usr/src/app/soybean/frontend/dist/ .

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
