const express = require("express");
const app = express();

const amqp = require("amqplib/callback_api");

const PORT = process.env.PORT || 4002;

const url = 'amqp://localhost:5672';
const topicExchange = 'topic_exchange_1';
const fanoutExchange = 'fanout_exchange_1';
const topicQueue1 = 'topic_queue_1';
const topicQueue2 = 'topic_queue_2';
const topicQueue3 = 'topic_queue_3';
const fanoutQueue = 'fanout_queue';
const fanoutQueueCallback = 'fanout_queue_callback';
const correlationId = Math.random().toString() + Math.random().toString() + Math.random().toString();

app.use(express.json());
app.listen(PORT, () => console.log("Server running at port " + PORT));

amqp.connect(url, function(error1, connection) {
    if (error1) {
        throw error1;
    }

    connection.createChannel(function(error2, channel) {
        if (error2) {
            throw error2;
        }

        channel.assertExchange(topicExchange, 'topic', {durable: true, alternateExchange: fanoutExchange});
        channel.assertExchange(fanoutExchange, 'fanout', {durable: true});

        channel.assertQueue(topicQueue1, {durable: true, arguments: {'x-queue-type': 'quorum', 'x-queue-leader-locator': 'balanced'}});
        channel.assertQueue(topicQueue2, {durable: true, arguments: {'x-queue-type': 'quorum', 'x-queue-leader-locator': 'balanced'}});
        channel.assertQueue(topicQueue3, {durable: true, arguments: {'x-queue-type': 'quorum', 'x-queue-leader-locator': 'balanced'}});
        channel.assertQueue(fanoutQueue, {durable: true, arguments: {'x-queue-type': 'quorum', 'x-queue-leader-locator': 'balanced'}});
        channel.assertQueue(fanoutQueueCallback, {durable: true, arguments: {'x-queue-type': 'quorum', 'x-queue-leader-locator': 'balanced'}});

        channel.bindQueue(topicQueue1, topicExchange, 'black');
        channel.bindQueue(topicQueue2, topicExchange, 'yellow');
        channel.bindQueue(topicQueue3, topicExchange, 'green');
        channel.bindQueue(fanoutQueue, fanoutExchange, '');

        // Consume the RPC fanout callback queue
        channel.consume(fanoutQueueCallback, function(message) {
            if (message.properties.correlationId == correlationId) {
                console.log('Received from the fanout callback queue: ', message.content.toString());
                channel.ack(message);
                setTimeout(function() {
                    connection.close();
                    process.exit();
                }, 500);
            }
        }, {
            noAck: false
         });

        var message = {test1: 'test1'};

        channel.publish(topicExchange, 'black', Buffer.from(JSON.stringify(message)), {deliveryMode: 2});
        channel.publish(topicExchange, 'yellow', Buffer.from(JSON.stringify(message)), {deliveryMode: 2});

        message = {test2: 'test2'};

        channel.publish(topicExchange, 'purple', Buffer.from(JSON.stringify(message)), {
            correlationId: correlationId,
            replyTo: fanoutQueueCallback,
            deliveryMode: 2
        }); // Should be redirected to the fanout exchange

        console.log('Messages sent to queue.');
    });

// Test

//    setTimeout(function() {
//        connection.close();
//        process.exit(0);
//    }, 500);
});
