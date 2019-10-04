
var host = location.origin.replace(/^http/, 'ws').replace(/^https/, 'wss');
//console.debug("host: "+host);

var connection = new WebSocket(host);
var msgTopic = "Topic#03102019";
var subscribedTopic = "";

connection.onopen = function() {
    console.log("connection established...");
    //subscribeToTopic(msgTopic);
    console.log("\nSubscribed to topic "+subscribedTopic+"\n");
    connection.send(JSON.stringify({
        type: "subscribe",
        topic: subscribedTopic,
    }));

};

// connection.onmessage = function(message) {
//     let msg = JSON.parse(message.data);
//     if(msg.type === "ACK") {
//         console.log("message received..."+msg.data);
//     }
// };

connection.onmessage = function(message) {
    let msg = JSON.parse(message.data);
    if(msg.type == "message") {
        if (msg.topic == subscribedTopic) { //msgTopic
            console.log("\nReceived message from topic "+subscribedTopic+"\nMessage: "+msg.data+"\n");
        }
    }
}

connection.onerror = function(error) {
    console.error("connection error...");
};

function sendmessage(_topic) {
    connection.send(JSON.stringify({
        type: "publish",
        topic: _topic, //msgTopic,
        value: "test message "+new Date().getTime(),
    }));
}

function getStatus() {
    connection.send(JSON.stringify({
        type: "status",
    }));
}

function subscribeToTopic(topic) {
    subscribedTopic = topic;
    console.log("Topic subscription received for "+topic);
}

function getConsumers(_topic) {
    connection.send(JSON.stringify({
        type: "consumers",
        topic: _topic,
    }));
}

function getTopics() {
    connection.send(JSON.stringify({
        type: "topics",
    }));
}
