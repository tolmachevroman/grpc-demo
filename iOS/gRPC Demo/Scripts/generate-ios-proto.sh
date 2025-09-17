#!/bin/bash
PROTO_DIR="./../../../proto/"
IOS_OUT_DIR="./Generated/"

mkdir -p "$IOS_OUT_DIR"
  
protoc \
  --swift_out="$IOS_OUT_DIR" \
  --grpc-swift-2_out=Client=true,Server=false:"$IOS_OUT_DIR" \
  --proto_path="$PROTO_DIR" \
  dashboard.proto

echo "✅ Generated Swift files"
