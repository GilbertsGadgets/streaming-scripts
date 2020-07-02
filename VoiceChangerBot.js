const {exec} = require("child_process");

// This is how we talk to chat
function say (message) {
  var response = {
      type: "chat_message",
      data: message
  };
  process.send(response);
};

function promptChat () {
  say('VoiceBot activated. Type "!higher" or "!lower" to change my voice.');
  var delay = (10 + Math.random() * 5) * 60000; // Delay of 10-15 minutes
  setTimeout(promptChat, delay);
};

promptChat();

var duration = 2*60*1000; // Each effect lasts for 2 minutes
var currPitch = 0;
const minPitch = -6;
const maxPitch = 10;

function setPitch (pitch) {
	let newPitch;
	if (pitch >= maxPitch) {
		newPitch = maxPitch;
	} else if (pitch <= minPitch) {
		newPitch = minPitch;
	} else { 
		newPitch = pitch;
	}
  console.log("Setting pitch to " + newPitch);
	exec('dconf write /com/github/wwmm/pulseeffects/sourceoutputs/pitch/semitones ' + newPitch);
};

// Initialize the pitch filter to 0
setPitch(0);

/********************** ACTION QUEUE **************************/

/*
 * Actions should have the following elements:
 * 
 * command: where you store a string containing the action command
 * duration: how long (in milliseconds) the action should last
 */

var actionQueue = [];
var actionQueueCallback = null;

function addToQueue (action) {
  actionQueue.push(action);
  
  startQueueRedemption();
};

function startQueueRedemption () {
  if (actionQueueCallback == null)
    redeemNextItemFromQueue();
};

function redeemNextItemFromQueue() {
  if (actionQueue.length >= 1) {
    // Get the next action from the queue
    let action = actionQueue.shift();
    
    // Perform the next action in the queue
    if (action.command == "DARKSIDE") {
      setPitch(-5);
      say("Now channeling the dark side of the force");
    } else if (action.command == "CHIPMUNK") {
      setPitch(8);
      say('Squirrel commander says "REVOLUTION!"');
    }
    
    // Now wait a certain amount of time before the next action
    actionQueueCallback = setTimeout(redeemNextItemFromQueue, action.duration);
    
  } else {
    setPitch(0);
    actionQueueCallback = null;
  }
};

/************************* INCOMING MESSAGES ****************************/

process.on('message', (message) => {
  if (message == "DARKSIDE_CHAT") {
    addToQueue({
      command: "DARKSIDE",
      duration: 30 * 1000
    });
  } else if (message == "CHIPMUNK_CHAT") {
    addToQueue({
      command: "CHIPMUNK",
      duration: 30 * 1000
    });
  } else if (message == "DARKSIDE_CHANNEL_POINTS") {
	addToQueue({
      command: "DARKSIDE",
      duration: 2 * 60 * 1000
    });
  } else if (message == "CHIPMUNK_CHANNEL_POINTS") {
	addToQueue({
      command: "CHIPMUNK",
      duration: 2 * 60 * 1000
    });
  }
});