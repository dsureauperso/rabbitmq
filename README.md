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

We'll mainly cover, in this article, the **Topic** and **Fanout** ones.

Note: a **binding** is a relationship between an exchange and a queue. 

A **Direct** exchange sends messages to the queues whose **binding key** matches exactly the **routing key** of the message.

In our example, the binding keys are 'black', 'yellow', 'green'.

A **Topic** exchange's logic is similar to a **Direct** one. **Topic** exchanges only add 2 important special cases for binding keys: 
- \* (star) can substitute for exactly one word,
- \# (hash) can substitute for zero or more words.

In our example, the Topic exchange acts like a Direct one.

A **Fanout** exchange simply ignores the bindings.

### RPC - Remote Procedure Call



### 3 nodes cluster / quorum queues

### 
