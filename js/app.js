
var host = location.origin.replace(/^http/, 'ws').replace(/^https/, 'wss');
console.debug("host: "+host);

var connection = new WebSocket(host);

connection.onopen = function() {
    console.log("connection established...");
};

connection.onmessage = function(message) {
    let msg = JSON.parse(message.data);
    if(msg.type === "ACK") {
        console.log("message received..."+msg.data);
        alert("message: "+msg.data);
    }
};

connection.onerror = function(error) {
    console.error("connection error...");
};

function sendmessage() {
    connection.send(JSON.stringify({
        type: "publish",
        channel: "c1",
        topic: "t1",
        value: "test data 1",
    }));
}