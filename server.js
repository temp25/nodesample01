"use strict";

process.title = "PubSub messages";

const PORT = process.env.PORT || 5000;

const WebSocketServer = require("websocket").server;
var http = require("http");
var fileSystem = require("fs");

var connections = [];
var clients = [];

var server = http.createServer(onRequest);
var wsServer = new WebSocketServer({
    httpServer: server,
});

//bind to dynamic PORT set by heroku at runtime
server.listen(PORT, function () {
    console.log((new Date())+"  Webserver listening on PORT " + PORT);
});

wsServer.on("request", function (request) {
    console.log((new Date()) + "Connection from origin " + request.origin + ".");
    var connection = request.accept(null, request.origin);
    clients.push(request.remoteAddress);
    connections.push(connection);
    console.log((new Date()) + "Connection accepted for client "+request.remoteAddress+". "+clients.length+" clients connected so far...");

    connection.on("message", function(message) {
        let data = JSON.parse(message.utf8Data);
        console.log("\nMessage received from client, type: "+data.type+"\tchannel: "+data.channel+"\ttopic: "+data.topic+"\tvalue: "+data.value+"\n\n")
        connection.sendUTF(JSON.stringify({
            type: "ACK",
            data: "message acknowledged",
        }));
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