# Front end guide
I hope you can understand this, even you have no knowledge on front end development.

## Prerequisites
- Node.js (v16 or above)
- pnpm (v7 or above)
- A modern web browser (e.g., Chrome, Firefox, Edge)

## Getting Started
1. Clone the repository:
   1. For WebStorm users, use the "New -> Project from Version Control" option.
   2. For VSCode users, use the "Clone repo" option from the welcome screen.
2. Navigate to the `frontend` directory: `cd frontend`
3. Install dependencies: `pnpm install`
4. You can try to start the development server:
    - `pnpm dev`
      - The development server will start at `http://localhost:9527`. But all your changes will be omitted no matter how you attempts.
      - This is because the frontend you accessed is point to instance in docker container, called `frontend`:
      ```
      # project-root/docker-compose.yml
      frontend:
       build:
        context: frontend/
      # image: soybean-admin-frontend:1.2.7
       environment:
        TZ: Asia/Shanghai
      depends_on:
        backend:
          condition: service_healthy
      ports:
        - "9527:80"
      networks:
        - soybean-admin
      ```
   - For this part of docker-compose (If you initiate the project using docker-compose), it will create a container named `frontend-1` (This is caused by docker compose automatically derives container names ended wit number by default unless specify explicitly) and build the image based on configuration stated in `frontend/Dockerfile`. For this container instance, it set environment's timezone to `Asia/Shanghai`, map port `80` in container to port `9527` in host, and connect it to network `soybean-admin` (A.K.A., host: 9527 -> container:80). The container will be started only after `backend` service is healthy.
   - You will noticed the image line was commented out. If uncomment it, docker compose will pull the image from docker hub instead of building it locally.
5. To make your changes take effect, you have to build the image and restart the container:
   ```
    docker-compose build frontend
    docker-compose up -d frontend
    pnpm run dev
   ```
   - First, we rebuild the image for `frontend` service, then restart the container in detached mode. In this step, we should ensure container `frontend`, `backend`, `postgres`, and `redis` are all stopped. If not, you will face error `port is already allocated`.
   - Finally, run `pnpm run dev` to observe the changes you made.
6. To utilize hot reload feature instead of rebuilding the image every time you made the changes, please use this command:
   ```
   pnpm run dev --port 3000
   ```
   - This will start a development server at `http://localhost:3000` with hot reload enabled. You can make changes to the source code, and the browser will automatically refresh to reflect those changes.
