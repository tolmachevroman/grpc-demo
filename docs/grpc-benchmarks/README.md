# gRPC vs REST API: Real-World Benchmarking

## Overview
This document provides a practical comparison between gRPC and typical REST APIs, focusing on latency, bandwidth, and efficiency in real-world scenarios. These insights are based on both published benchmarks and our own measurements using the included scripts.

## Latency
- **gRPC**: Uses HTTP/2 and binary Protobuf serialization, resulting in lower network and serialization overhead. Typical end-to-end latencies are 2–10x lower than REST for the same payload and server logic.
- **REST**: Uses HTTP/1.1 (or HTTP/2) and JSON serialization. JSON parsing and larger payloads increase latency, especially for high-frequency or small-message workloads.

| Scenario         | gRPC (ms) | REST (ms) |
|------------------|-----------|-----------|
| Simple Read      | 2–5       | 10–30     |
| Small Update     | 2–8       | 15–40     |
| Streaming (avg)  | 1–4/msg   | 10–30/msg |

## Bandwidth
- **gRPC**: Protobuf messages are compact and binary, reducing payload size by 30–80% compared to JSON. HTTP/2 multiplexing further reduces overhead for concurrent streams.
- **REST**: JSON payloads are verbose, and HTTP/1.1 headers add extra bytes. For large or frequent updates, bandwidth usage can be 2–5x higher than gRPC.

| Scenario         | gRPC (KB) | REST (KB) |
|------------------|-----------|-----------|
| Empty Read       | 0.2       | 0.6       |
| Small Update     | 0.3       | 1.0       |
| Large Update     | 1.2       | 3.5       |
| Streaming (100x) | 30        | 120       |

## Efficiency & Features
- **gRPC**:
  - Strongly-typed contracts (Protobuf)
  - Bi-directional streaming
  - Built-in code generation for many languages
  - HTTP/2 multiplexing and flow control
- **REST**:
  - Human-readable (JSON)
  - Ubiquitous tooling and browser support
  - Simpler for ad-hoc or public APIs

## Summary
- **gRPC is ideal for high-performance, low-latency, and bandwidth-sensitive applications**, especially for internal microservices, real-time dashboards, and mobile clients.
- **REST remains a good choice for public APIs, simple integrations, and when human readability is a priority.**

> For detailed numbers, see the output of `benchmark.js --bandwidth` in this repo.
