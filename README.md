# RabbitMQ

## Architecture

![Alt text](/assets/architecture_rabbitmq.png?raw=true "RabbitMQ architecture")

## Docker commands

- **docker-compose up** : to start the containers
- **docker-compose down** : to kill the runnin containers
- **docker exec -it rabbitmq1 bash** : to access the running container bash (here rabbitmq1)
- **rabbitmqctl stop_app / rabbitmqctl start_app** : to kill / start the node running on the container

## Overview

This project is a RabbitMQ proof of concept (POC).

RabbitMQ is a deployed open source message broker.

We'll overview different features:
- **Exchanges,**
- **Data persistency,**
- **Clustering / queue mirroring.**

Some reminders:
- **Producer**: an user application that sends messages to the RabbitMQ server,
- **Queue**: a buffer that stores messages,
- **Consumer**: an user application that receives messages.

## Features

### Exchanges

A RabbitMQ exchange, on one side, receives messages from the **producer** and, on the other side, pushes those messages to the different **queues**.

There are different exchange types:
- **direct**,
- **topic**,
- **headers**,
- **fanout**.

Each has his own ways to adress the queues.

We'll quickly cover, in this article, the **Topic** and **Fanout** ones.

Note: a **binding** is a relationship between an exchange and a queue. 

A **Direct** exchange sends messages to the queues whose **binding key** matches exactly the **routing key** of the message.

In our example, the binding keys are 'black', 'yellow', 'green'.

A **Topic** exchange's logic is similar to a **Direct** one. **Topic** exchanges only add 2 important special cases for binding keys: 
- \* (star) can substitute for exactly one word,
- \# (hash) can substitute for zero or more words.

In our example, the Topic exchange acts like a Direct one.

A **Fanout** exchange simply ignores the bindings.

In our example, it will receive the messages whose routing key do not match any existing queue binding key.

### RPC - Remote Procedure Call

The RPC pattern is used when the producer awaits a response from the consumer.

Doing RPC over RabbitMQ is quite easy: once the server (i.e. any consumer) receives the message, it will publish a response in a callback queue the client (i.e. any producer) is listenning to.

We use a **correlation_id** to identify the upcoming request and its response sent back to the callback queue.

### Clustering / queues mirroring / load balancing

Here are the main features we are covering with this POC.

A RabbitMQ cluster is a logical grouping of one or several nodes, each sharing users, virtual hosts, queues, exchanges, bindings, runtime parameters and other distributed state.

In this example, we set up a 3-nodes RabbitMQ cluster.

Clusters ensure the continuity of service in case of node falls. Clusters must have an odd number of nodes (1, 3, 5, etc.). A N-nodes cluster will still be effective if, at maximum, N/2 + 1 node are up.

In our example of 3 nodes, the service is sure to be OK with 1 node KO.
 
#### Data persistency

To keep alive the queues and exchanges at container restart, we set the exchanges and queues as durable.

We also mark the messages with deliveryMode = 2 (persistent).

Once the queues and exchanges are **durable** and the messages are published as **persistent**, RabbitMQ will save the queued messages on disk in case of server restart.

#### Queue replicas / continuity of service

In order to use a RabbitMQ cluster, the queues need to be of type **quorum** (in opposite with classic queues).

Quorum queues are declared with up to five replicas (one per node). On a 3-nodes cluster, each quorum queue will has 3 replicas, once on each node.

Every quorum queue has a primary replica. That replica is called **queue leader**.

In case of a node failure, a new queue leader will be elected. 

The **queue_leader_locator** parameter is set to **balanced** in the configuration files to tell RabbitMQ to pick the node hosting the minimum number of quorum queue leaders as the new queue leader location.

#### High Availability Proxy 
 
We also use a HaProxy to balance the load equally between the different nodes. 
