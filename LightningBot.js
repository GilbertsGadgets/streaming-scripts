var LightningBot = require('./LightningBot.json');

// This is how we talk to chat
function say (message) {
  var response = {
      type: "chat_message",
      data: message
  };
  process.send(response);
};

function promptChat () {
  say('Ask me a random question with "!question"');
  var delay = (10 + Math.random() * 5) * 60000; // Delay of 10-15 minutes
  setTimeout(promptChat, delay);
};

function randomQuestion () {
  var index = Math.floor(Math.random() * LightningBot.questions.length);
  say(LightningBot.questions[index]);
};

const raidQuestionsToAdd = 7;
var raidQuestionsLeft = 0
var raidQuestionDelay = 8 * 1000;
var raidCountdown = 0;
var raidCountdownDelay = 2 * 1000;
var currTimeout = null;

function rapidFire () {
  if (raidCountdown > 0) {
    say("" + raidCountdown + "...");
    raidCountdown--;
    
    // Create a timeout to continue the countdown
    currTimeout = setTimeout(rapidFire, raidCountdownDelay);
    
  } else if (raidQuestionsLeft > 0) {
    // Ask a question and reduce the count
    randomQuestion();
    raidQuestionsLeft--;
    
    // Create a timeout to ask the next question
    currTimeout = setTimeout(rapidFire, raidQuestionDelay);
    
  } else {
    say("Lightning round terminated.");
    currTimeout = null;
  }
}

process.on('message', (message) => {
  console.log("Received message: " + message);
  
  if (message.toUpperCase() == "QUESTION") {
    randomQuestion();
    
  } else if (message.toUpperCase() == "RAID") {
    // Only start a rapid fire if there isn't already one going.
    if(currTimeout == null) {
      say("Lightning round activated.");
      
      // Add to the question queue
      raidQuestionsLeft += raidQuestionsToAdd;

      // Make sure there's a countdown
      raidCountdown = 5;
      
      // Start
      rapidFire();
      
    } else {
      // Just add to the question queue
      raidQuestionsLeft += raidQuestionsToAdd;
    }
  }
  
});