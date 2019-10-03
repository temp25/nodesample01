
var host = location.origin.replace(/^http/, 'ws').replace(/^https/, 'wss');
//console.debug("host: "+host);

var connection = new WebSocket(host);
var msgTopic = "Topic#03102019";

connection.onopen = function() {
    console.log("connection established...");
    subscribeToTopic(msgTopic);
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
        if (msg.topic == msgTopic) {
            console.log("\nReceived message from topic "+msgTopic+"\nMessage: "+msg.data+"\n");
        }
    }
}

connection.onerror = function(error) {
    console.error("connection error...");
};

function sendmessage() {
    connection.send(JSON.stringify({
        type: "publish",
        topic: msgTopic,
        value: "test message "+new Date().getTime(),
    }));
}

function subscribeToTopic(topic) {
    console.log("\nSubscribed to topic "+topic+"\n");
    connection.send(JSON.stringify({
        type: "subscribe",
        topic: topic,
    }));
}