const express = require("express");
const app = express();

const amqp = require("amqplib/callback_api");

const PORT = process.env.PORT || 5006;

const url = 'amqp://localhost:5672';
const fanoutExchange = 'fanout_exchange_1';
const fanoutQueue = 'fanout_queue';

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
        channel.assertExchange(fanoutExchange, 'fanout', {durable: true});
        channel.assertQueue(fanoutQueue, {durable: true, arguments: {'x-queue-type': 'quorum', 'x-queue-leader-locator': 'balanced'}});
        channel.consume(fanoutQueue, function(message) {
            if (message.content) {
                console.log('(fanout_queue) message received: ', JSON.parse(message.content));
                // Publish in the fanout callback queue
                channel.sendToQueue(message.properties.replyTo, Buffer.from('test callback'), {
                    correlationId: message.properties.correlationId,
                    deliveryMode: 2
                });
                channel.ack(message);
            }
        }, {
            noAck: false
        });
    });
}
