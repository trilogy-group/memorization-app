#!/bin/bash

set -ex

#aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 280022023954.dkr.ecr.us-east-1.amazonaws.com
docker build -t memoryapp .
docker tag memoryapp:latest 280022023954.dkr.ecr.us-east-1.amazonaws.com/memoryapp:latest
docker push 280022023954.dkr.ecr.us-east-1.amazonaws.com/memoryapp:latest
