# gRPC Demo
Demo app of seamless &amp; efficient interaction between web app and mobile clients using gRPC

## Overview
The goal of this project is to model a somewhat real-life example of a client-server communication using [gRPC](https://grpc.io/).

The birds eye view of the tech stack:

- [Protobuf](https://protobuf.dev/) for `.proto` files definitions, which then used in both server and client code generation;
- [Node.js](https://nodejs.org/en/learn/getting-started/introduction-to-nodejs) and [Envoy](https://www.envoyproxy.io/) for running the server;
- Vainilla [React](https://react.dev/) app using [Vite](https://vite.dev/) and [Typescript](https://www.typescriptlang.org/);
- Android app using Kotlin & Compose and modern architecture;
- iOS app using Swift and Swift UI and modern architecture.


## gRPC Useful Resources
I've collected a few YouTube links and articles for those who are new to gRPC or want to refresh their memory:

- [Official gRPC website](https://grpc.io/)
- [gRPC vs REST](https://www.ibm.com/think/topics/grpc-vs-rest)
- [99% of Developers Don't Get RPCs](https://www.youtube.com/watch?v=K4_cgtAe4HM&ab_channel=TheCodingGopher)
- [Can gRPC replace REST and WebSockets for Web Application Communication?](https://grpc.io/blog/postman-grpcweb/)
- [What is gRPC?](https://grpc.io/docs/what-is-grpc/)

## Comparing to other solutions
There are surprisingly [fewer alternatives](docs/grpc-vs-other-solutions/README.md) that one would expect. gRPC is the most maintained and cleanest one of all of them. Using gRPC not only [lowers the bandwidth and latency substantially](docs/grpc-benchmarks/README.md), it forces you to re-think the existing REST API structure, replacing one-thousand-lines payload dinasaurs with compact, binary procedure calls. 

In the systems where clients rely on repetitive pulling to show somewhat updated information to the user, gRPC could pro-actively push atomic updates to the clients, as well as receive atomic updates from the clients.
