const WebSocket = require("ws");
const tmi = require("tmi.js");

// Define configuration options
const bb_opts = require("./gg_BubbleBot_OAuth.json");
const gg_opts = require("./GilbertsGadgets_OAuth.json");
const bot_opts = require("./GadgetBot_OAuth.json");

/************ TWITCH CHAT MONITOR **************/

// Create a client with our options
const bot_client = new tmi.client(bb_opts);

// Register our event handlers (defined below)
bot_client.on('message', bot_onMessageHandler);
bot_client.on('connected', bot_onConnectedHandler);
bot_client.on('disconnect', bot_onDisconnectHandler);

// Connect to Twitch:
bot_client.connect();

function bot_say(message) {
  bot_client.say("gilbertsgadgets", message);
}
    
function bot_helpMessage(target) {
    bot_client.say(target, "Bubble bot accepts the following commands: {rainbow, swipe, breathe, fire, flare, meteor, rain, static, sparkle, balls}, an HTML color name, or a hex color code preceeded by '#'. Separate multiple commands and/or colors with spaces.");
}

// Called every time a message comes in
function bot_onMessageHandler (target, context, msg, self) {
  if (self) { return; } // Ignore messages from the bot

  // Remove whitespace from chat message
  const cmd = msg.trim().split(" ");

  if (cmd[0].charAt(0) != '!') { return; } // Ignore messages that don't begin with "!"

  // If the command is known, let's execute it
  if (cmd[0] === '!test') {
    console.log('Command "!test" received');
  } else {
    console.log("*** Unknown bot/command" + cmd[0] + "***");
  }
}

// Called every time the bot connects to Twitch chat
function bot_onConnectedHandler (addr, port) {
  console.log("* Connected to " +addr + ":" + port);
}

function bot_onDisconnectHandler (addr, port) {
  console.log("* Disconnected from " + addr + ":" +port);
  console.log("* Attempting to reconnect");
  bot_client.connect();
}

/********** PubSub WEBSOCKET **********/

var hostname = "wss://pubsub-edge.twitch.tv";

var Socket = null;

function ws_onOpen() {
  console.log("Connected to Twitch PubSub");
  ws_ping();
  pubSub_begin();
}

var pongReceived = false;

function ws_ping() {
  console.log("Sending weird Twitch PING");
  pingMessage = {
    "type": "PING"
  }
  Socket.send(JSON.stringify(pingMessage));
}

function ws_onPong() {
  console.log("PONG received");
  pongReceived = true;
}

function ws_onMessage(event) {
  ws_message = JSON.parse(event);
  
  if (ws_message.type == 'MESSAGE') {
    
    let topic = ws_message.data.topic;
    let message = ws_message.data.message;
    console.log("Message received:");
    console.log("Topic: " + topic);
    console.log("Message: " + message);
    message = JSON.parse(message);
    
    if (topic == "channel-points-channel-v1.474275235") {
      if(message.data.redemption.reward.id == "9f5323c7-2789-46fd-8d4d-f5db6fd32990") { // OFF LIMITS!
        bot_say(message.data.redemption.user.display_name + ", what have you done? NotLikeThis");
      }
    }
    
  } else if (ws_message.type == 'RECONNECT') { // This typically happens for twitch maintenance.
    
    // Disconnect and reconnect within 30 seconds.
    console.log("Reconnect request received. Opening new websocket.");
    setTimeout(ws_beginWebSocket, 1000);
    
  } else if (ws_message.type == 'PONG') {
    
    console.log("Weird Twitch PONG received.");
    pongReceived = true;
    
  } else {
    
    console.log("Misc websocket message received: " + event);
    
  }
}


var keepAlive = null;

function ws_keepAlive() {
  if(pongReceived == true) {
    // Connection is good
    // Reset the flag and ping again to keep alive
    pongReceived = false;
    ws_ping();
  } else {
    // Close the websocket and start a new one
    // We will ping again on open
    console.log("No PONG received. Closing websocket and restarting");
    clearInterval(keepAlive);
    keepAlive = null;
    Socket.close();
  }
}

function ws_beginWebSocket() {
  if (Socket != null) {
    Socket.close();
  }
  console.log("Starting WebSocket connection at " + hostname);
  Socket = new WebSocket(hostname);
  Socket.on("open", ws_onOpen);
  Socket.on("pong", ws_onPong);
  Socket.on("close", ws_beginWebSocket);
  Socket.on("message", ws_onMessage);
  
  if(keepAlive == null) {
    keepAlive = setInterval(ws_keepAlive, 4 * 60 * 1000);
  }
}

/************ PUB SUB FUNCTIONS ****************/

// Source: https://www.thepolyglotdeveloper.com/2015/03/create-a-random-nonce-string-using-javascript/
function nonce_gen(length) {
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for (var i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}

function listen(topic) {
  message = {
      type: 'LISTEN',
      nonce: nonce_gen(15),
      data: {
          topics: [topic],
          auth_token: bot_opts.client_oauth_token
      }
  };
  Socket.send(JSON.stringify(message));
  console.log('Requested to listen to topic "' + topic + '". (nonce = ' + message.nonce + ')' );
}

function pubSub_begin() {
  console.log("Requesting to listen to channel points events");
  listen("channel-points-channel-v1."+bot_opts.gg_user_id);
}

ws_beginWebSocket();