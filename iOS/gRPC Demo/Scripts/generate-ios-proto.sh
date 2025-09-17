#!/bin/bash
PROTO_DIR="./../../../proto/"
IOS_OUT_DIR="./Generated/"

mkdir -p "$IOS_OUT_DIR"

#protoc \
#  --plugin=protoc-gen-grpc-swift=/usr/local/bin/protoc-gen-grpc-swift-2 \
#  --grpc-swift_out="$IOS_OUT_DIR" \
#  --proto_path="$PROTO_DIR" \
#  dashboard.proto
  
protoc \
  --swift_out="$IOS_OUT_DIR" \
  --grpc-swift_out="$IOS_OUT_DIR" \
  --proto_path="$PROTO_DIR" \
  dashboard.proto

echo "✅ Generated Swift files"
