const express = require("express");
const app = express();

const amqp = require("amqplib/callback_api");

const PORT = process.env.PORT || 5005;

const url = 'amqp://localhost:5672';
const topicExchange = 'topic_exchange_1';
const fanoutExchange = 'fanout_exchange_1';
const topicQueue2 = 'topic_queue_2';

app.use(express.json());
app.listen(PORT, () => console.log("Server running at port " + PORT));

let amqpConnection = null;

connect();

function connect() {
    amqp.connect(url, function(error, connection) {
        if (error) {
            console.error('[AMQP]: ', error.message);
            // reconnect
            return setTimeout(connect, 1000);
        }
        connection.on('error', function(error) {
            if (error) {
                console.error('[AMQP] connection error: ', error.message);
            } else {
                console.error('[AMQP] connection error');
            }
        });
        connection.on('close', function() {
            console.log('[AMQP] connection closed -> reconnecting');
            // reconnect
            return setTimeout(connect, 1000);
        });
        console.log('[AMQP] connected');
        amqpConnection = connection;
        // consume the fanout queue
        consume();
    });
}

function consume() {
    amqpConnection.createChannel(function(error, channel) {
        if (error) {
            throw error;
        }
        channel.on('error', function(error) {
            console.error('[AMQP] channel error: ', error.message);
        });
        channel.on('close', function() {
            console.log('[AMQP] channel closed');
        });
        channel.assertExchange(topicExchange, 'topic', {durable: true, alternateExchange: fanoutExchange});
        channel.assertQueue(topicQueue2, {durable: true, arguments: {'x-queue-type': 'quorum', 'x-queue-leader-locator': 'balanced'}});
        channel.consume(topicQueue2, function(message) {
            if (message.content) {
                console.log('(topic_queue_2) message received: ', JSON.parse(message.content));
                channel.ack(message);
            }
        }, {
            noAck: false
        });
    });
}
