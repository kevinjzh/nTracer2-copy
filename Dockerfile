FROM python:3.10-slim as backend-builder
RUN apt-get update && apt-get install -y --no-install-recommends gcc g++
RUN pip --no-cache-dir install cython
RUN pip --no-cache-dir install --user neuroglancer ngauge flask flask-socketio numpy python-dotenv fastapi "uvicorn[standard]" sse-starlette httpx
COPY backend/compile_cython.py /app/compile_cython.py
COPY backend/algorithm /app/algorithm
WORKDIR /app
RUN python compile_cython.py build_ext --inplace

#FROM python:3.10-slim as db-builder
#RUN apt-get update && apt-get install -y --no-install-recommends libgeos-dev gcc g++ libsqlite3-dev liblz4-dev libbz2-dev libboost-all-dev libx264-dev libzstd-dev
#COPY db /app
#WORKDIR /app
#RUN g++ -O3 app.cpp -Iasio_include -lpthread -lsqlite3 -lz -lx264 -lzstd -std=c++17

FROM node:gallium-alpine3.18 as dashboard-builder
COPY dashboard /app
WORKDIR /app
RUN npm install
RUN npm run build

FROM python:3.10-slim
RUN mkdir /app
ENV INTERNAL_NEUROGLANCER_ADDRESS=0.0.0.0
ENV INTERNAL_NEUROGLANCER_PORT=8050
ENV INTERNAL_SERVER_PORT=8085
ENV PATH=/root/.local/bin:$PATH
RUN apt-get update && apt-get install -y --no-install-recommends libx264-dev
COPY backend /app
#COPY --from=db-builder /app/a.out /app/db-server
COPY --from=backend-builder /app/algorithm/astar/*.so ./app/algorithm/astar/
COPY --from=backend-builder /root/.local /root/.local
COPY --from=dashboard-builder /app/build /app/dashboard
COPY docker_runner.sh /app/docker_runner.sh
#COPY db/data /mnt/data1
COPY /landing /app/landing
WORKDIR /app
CMD /app/docker_runner.sh
