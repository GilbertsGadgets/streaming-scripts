const WebSocket = require("ws");
const colorNames = require("css-color-names");


/********** ESP8266 WEBSOCKET **********/

var network = "192.168.0.";
//var hostname = network + "113"; //ESP-01S
//var hostname = network + "116"; //ESP-01
var hostname = network + "104";

if(process.argv.length > 2) {
  hostname = network + process.argv[2];
}


console.log("Starting WebSocket connection at ws://" + hostname + ":81/");

var Socket = null;

function ws_onOpen() {
  console.log("Connected to ESP8266");
  ws_ping();
};

var pongReceived = false;

function ws_ping() {
  console.log("Sending PING");
  Socket.ping();
}

function ws_onPong() {
  console.log("PONG received");
  pongReceived = true;
}

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
    Socket.close();
  }
}

var keepAlive = null;

function ws_beginWebSocket() {
  Socket = new WebSocket('ws://' + hostname + ':81/');
  Socket.on("open", ws_onOpen);
  Socket.on("pong", ws_onPong);
  Socket.on("close", ws_beginWebSocket);
  
  if(keepAlive == null) {
    keepAlive = setInterval(ws_keepAlive, 10000);
  }
};

ws_beginWebSocket();


/************ BUBBLE BOT FUNCTIONS **************/

// This is how we talk to chat
function say (message) {
  var response = {
      type: "chat_message",
      data: message
  };
  if(process.send)  
    process.send(response);
};

var patterns = {
  rainbow: "RAINBOW",
  swipe: "SWIPE",
  swiping: "SWIPE",
  swiped: "SWIPE",
  breathe: "BREATHE",
  fire: "FIRE",
  flare: "FLARE",
  meteor: "METEOR",
  rain: "METEOR",
  static: "STATIC",
  sparkle: "SPARKLE",
  balls: "BALLS",
  ball: "BALLS"
}

function BubbleBotHelpMessage() {
    say("Bubble bot accepts the following commands: {rainbow, swipe, breathe, fire, flare, meteor, rain, static, sparkle, balls}, an HTML color name, or a hex color code preceeded by '#'. Separate multiple commands and/or colors with spaces.");
}

function bb_annoyChat () {
  say("Change colors on Gilbert's bubble light with command " + '"!bubble"');
  var delay = (10 + Math.random() * 5) * 60000; // Delay of 10-15 minutes
  setTimeout(bb_annoyChat, delay);
}

bb_annoyChat();


var savedColor = "#FFFFFF";
var savedPattern = patterns[0];
var savedSpeed = 5;

// Called every time a message comes in
process.on('message', (msg) => {
  // Remove whitespace from chat message
  const cmd = msg.trim().split(" ");

  // If the command is known, let's execute it
  if (cmd[0].toLowerCase() === '!bubble' ||
      cmd[0].toLowerCase() === '!bubbles'  ) {
    console.log("Bubble bot received a command");
    
    if (cmd.length == 1){
      // Instruct the plebs on twitch about how to control bubble bot
      BubbleBotHelpMessage();
      console.log("What am I supposed to do? Help message sent to chat.");
    } else if (cmd[1].toLowerCase() == "help") {
      BubbleBotHelpMessage();
      console.log("Help requested. Help dispatched.");
    } else {
      var newThing, newThingType;
      var colorFlag = 0;
      var patternFlag = 0;
      var animations = [];
      for (i=1; i < cmd.length; i++) {
        newThing = null;
        newThingType = null;
        if (cmd[i].length >= 7 && cmd[i].toLowerCase().startsWith("speed=")) {
          var newSpeed = cmd[i].slice(6, 7); // Only one-digit speeds allowed
          if (newSpeed >= 1 && newSpeed <= 9) {
            savedSpeed = newSpeed;
          }
        } else if (cmd[i].startsWith("#")) {
          newThing = cmd[i].toUpperCase();
          newThingType = "color";
        } else if (patterns[cmd[i].toLowerCase()] !== undefined) {
          newThing = patterns[cmd[i].toLowerCase()];
          newThingType = "pattern";
        } else if (colorNames[cmd[i].toLowerCase()] !== undefined) {
          newThing = colorNames[cmd[i].toLowerCase()];
          newThingType = "color";
        } else {
          // Ignore words that have no meaning
        }
        
        if (newThingType === "color") {
          if(colorFlag == 0) {
            savedColor = newThing;
            colorFlag = 1;
          } else {
            animations.push( {
              color: savedColor,
              pattern: savedPattern,
              speed: savedSpeed
            } );
            savedColor = newThing;
            colorFlag = 1;
            patternFlag = 0;
          }
        } else if (newThingType === "pattern") {
          if(patternFlag == 0) {
            savedPattern = newThing;
            patternFlag = 1;
          } else {
            animations.push( {
              color: savedColor,
              pattern: savedPattern,
              speed: savedSpeed
            } );
            savedPattern = newThing;
            colorFlag = 0;
            patternFlag = 1;
          }
        }
      } // end for loop
      
      // Check if we have an unsaved animation
      if(colorFlag != 0 || patternFlag != 0) {
        animations.push( {
          color: savedColor,
          pattern: savedPattern,
          speed: savedSpeed
        } );
      }
      
      // We now have an animations array. Let's print it to terminal to make sure it looks okay.
      console.log("Animations received:");
      for (a of animations) {
        console.log("{" + a.color + ", " + a.pattern + ", " + a.speed + "}");
      }
      
      // Send the animation sequence to the ESP8266
      // Create one giant mega-string to send to the ESP
      var packet = "ANIMATION";
      // var packet = "ANIMATION|LENGTH=" + animations.length;
      for (a of animations) {
        packet = packet + "|" + a.color + "," + a.pattern + "," + a.speed;
      }
      console.log("Packet = " + packet);
      
      Socket.send(packet);
    }
    
  }
});
