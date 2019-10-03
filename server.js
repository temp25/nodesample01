"use strict";

process.title = "PubSub messages";

const PORT = process.env.PORT || 5000;

const WebSocketServer = require("websocket").server;
var http = require("http");
var fileSystem = require("fs");
const imqueue = require('in-memory-queue');
const Promise = require('bluebird');
imqueue.setQueueConfiguration(10000000, 5);

var serverStartTime;
var connections = [];
var clients = [];
var topics = [];

var server = http.createServer(onRequest);
var wsServer = new WebSocketServer({
    httpServer: server,
});

//bind to dynamic PORT set by heroku at runtime
server.listen(PORT, function () {
    serverStartTime = new Date().getTime();
    console.log((new Date())+"  Webserver listening on PORT " + PORT);
    var osUptime = require("os").uptime();
    var osUptimeSince = new Date(Date.now() -  osUptime * 1000 );
    var processUptime = process.uptime();
    console.log("System uptime: "+osUptime+" milliseconds  up since "+getFormattedDate(osUptimeSince));
    console.log("Process uptime: "+processUptime+" seconds");
});

wsServer.on("request", function (request) {
    console.log((new Date()) + "Connection from origin " + request.origin + ".");
    var connection = request.accept(null, request.origin);
    clients.push(request.remoteAddress);
    connections.push(connection);
    console.log((new Date()) + "Connection accepted for client "+request.remoteAddress+". "+clients.length+" clients connected so far...");

    connection.on("message", function(message) {
        let data = JSON.parse(message.utf8Data);
        // console.log("\nMessage received from client, type: "+data.type+"\tchannel: "+data.channel+"\ttopic: "+data.topic+"\tvalue: "+data.value+"\n\n")
        // connection.sendUTF(JSON.stringify({
        //     type: "ACK",
        //     data: "message acknowledged",
        // }));

        let msgType = data.type;
        let msgTopic = data.topic;
        let msgPayload = data.value;

        if(msgType === "publish" || msgType === "subscribe") {
            
            //Create topic if not exists
            if(topics.indexOf(msgTopic) === -1){
                topics.push(msgTopic);
                imqueue.createTopic(msgTopic).then((result)=>{ 
                    if(result.topic === msgTopic && result.success){
                        console.log(`Created topic, '${msgTopic}'`);
                    }
                    return;
                });
            }

            if(msgType === "publish") {
                let jsonMsg = {msgData: msgPayload};
                imqueue.createMessage(msgTopic, JSON.stringify(jsonMsg))
                .then((result) => {
                    let msg = result.message;
                    console.log(`\nMessage topic ${msg.getId()}`);
                    console.log(`Message topic ${msg.getTopic()}`);
                    console.log(`Message created timestamp ${msg.getCreated()}`);
                    console.log(`Message allowed retries ${msg.getAllowedRetries()}`);
                    console.log(`Message value ${msg.getValue()}`);
                    console.log(`Message processed ${msg.getProcessed()}\n`);
                });
            } else {
                imqueue.createConsumer(msgTopic, 1, function (msg) {
                    //console.log(`Handler task executing ${msg.getValue()}`);
                    connection.sendUTF(JSON.stringify({
                        topic: msgTopic,
                        type: "message",
                        data: JSON.parse(msg.getValue()).msgData,
                    }));
                    return Promise.resolve();
                }).then((consumer)=> {
                    console.log(`Consumer id ${consumer.getId()}`);
                    console.log(`Consumer topic ${consumer.getTopic()}`);
                    console.log(`Consumer priority ${consumer.getPriority()}`);
                });
            }
        } else {
            //TODO: Add other endpoints here
        }


    });

    connection.on("close", function(conn) {
        clients = clients.filter(client => client != connection.remoteAddress);
        connections = connections.filter(conn => conn != connection);
        console.log((new Date()) + " Peer " + connection.remoteAddress + " disconnected."+". "+clients.length+" clients connected so far...");
    });

});

function onRequest(request, response) {
    console.log("Request: "+request.url);

    request.url = request.url === "/" ? "/index.html": request.url;
    var contentType = getFileTypeFromRequestUrl(request.url);

    if(contentType !== "") {    
            serveFile(response, "."+request.url, contentType);
    } else {
        //TODO: Handle 404 here
    }

    /* if (request.url === "/" || request.url === "/index.html") {
        serveFile(response, "./index.html", "text/html");
    } else if(request.url === "/js/socket.io.slim.js"){
        serveFile(response, "./js/socket.io.slim.js", "text/javascript");
    } else {
        //TODO: Handle 404 here
    } */
}

function getFileTypeFromRequestUrl(requestUrl) {
    const fileExt = requestUrl.substring(requestUrl.lastIndexOf(".")+1);
    return getContentTypeFromExtension(fileExt);
}

function getContentTypeFromExtension(fileExt) {
    switch (fileExt) {
        case "png": return "image/png";
        case "ico": return "image/x-icon";

        case "/":
        case "": return "text/json";
        case "html": return "text/html";
        
        case "js": return "text/javascript";
        case "css": return "text/css";
        
        default: return "";
    }
}

function serveFile(response, filePath, contentType) {
    fileSystem.readFile(filePath, function (err, fileContent) {
        response.writeHead(200, {
            'Content-Type': contentType
        });
        response.write(String(fileContent));
        response.end();
    });
}

function getFormattedDate(unformattedDate){
    var d = unformattedDate;
    var timeZone = d.toTimeString().substring(d.toTimeString().indexOf(" "));
    d = d.getFullYear() + "-" + ('0' + (d.getMonth() + 1)).slice(-2) + "-" + ('0' + d.getDate()).slice(-2) + " " + ('0' + d.getHours()).slice(-2) + ":" + ('0' + d.getMinutes()).slice(-2) + ":" + ('0' + d.getSeconds()).slice(-2)+" "+timeZone;
    return d;
}
