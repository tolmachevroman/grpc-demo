#!/bin/bash

# Generate proper ES6 modules for browser use

PROTO_DIR="../proto"
OUT_DIR="./src/generated"

echo "Generating gRPC-Web proto files..."

# Clean and regenerate
rm -rf ${OUT_DIR}
mkdir -p ${OUT_DIR}

# Generate with ES6 modules - this is the proper way for browsers
protoc -I=${PROTO_DIR} \
  --ts_out=import_style=typescript:$OUT_DIR \
  --grpc-web_out=import_style=typescript,mode=grpcweb:$OUT_DIR \
  ${PROTO_DIR}/dashboard.proto

ls -la ${OUT_DIR}/
