/* global $, sessionStorage */

$(document).ready(runProgram); // wait for the HTML / CSS elements of the page to fully load, then execute runProgram()
  
function runProgram(){
  ////////////////////////////////////////////////////////////////////////////////
  //////////////////////////// SETUP /////////////////////////////////////////////
  ////////////////////////////////////////////////////////////////////////////////
  // Constant Variables
  var FRAME_RATE = 60;
  var FRAMES_PER_SECOND_INTERVAL = 1000 / FRAME_RATE;
  var walker = {
    "x": 0,
    "y": 0,
    "speedX": 0,
    "speedY": 0,
  }
  var walker2 = {
    "x": 100,
    "y": 100,
    "speedX": 0,
    "speedY": 0,
  }
  // Game Item Objects
  const KEY = {
  "ENTER": 13,
  "LEFT": 37,
  "RIGHT": 39,
  "UP": 38,
  "DOWN": 40,
  "W": 87,
  "A": 65,
  "S": 83,
  "D": 68,
};

  // one-time setup
  var interval = setInterval(newFrame, FRAMES_PER_SECOND_INTERVAL);   // execute newFrame every 0.0166 seconds (60 Frames per second)

  /* 
  This section is where you set up event listeners for user input.
  For example, if you wanted to handle a click event on the document, you would replace 'eventType' with 'click', and if you wanted to execute a function named 'handleClick', you would replace 'handleEvent' with 'handleClick'.

  Note: You can have multiple event listeners for different types of events.
  */
  $(document).on('keydown', handleKeyDown);    
  $(document).on("keyup", handleKeyUp);
  $("#board").on("click").css("background-color", changeColour);                      

  ////////////////////////////////////////////////////////////////////////////////
  ///////////////////////// CORE LOGIC ///////////////////////////////////////////
  ////////////////////////////////////////////////////////////////////////////////

  /* 
  On each "tick" of the timer, a new frame is dynamically drawn using JavaScript
  by calling this function and executing the code inside.
  */
  function newFrame() {
    repositionGameItem();
    wallCollision();
    redrawGameItem();
  }
  
  /* 
  This section is where you set up the event handlers for user input.
  For example, if you wanted to make an event handler for a click event, you should rename this function to 'handleClick', then write the code that should execute when the click event occurs.
  
  Note: You can have multiple event handlers for different types of events.
  */
  function handleKeyDown(event) {
    console.log(event.which);
    if (event.which === KEY.LEFT) {
  console.log("left pressed");
  walker.speedX = -5
}
  if (event.which === KEY.RIGHT) {
  console.log("right pressed");
  walker.speedX = 5
}
  if (event.which === KEY.UP) {
  console.log("up pressed");
  walker.speedY = -5
}
  if (event.which === KEY.DOWN) {
  console.log("down pressed");
  walker.speedY = 5
}

if (event.which === KEY.A) {
  console.log("left pressed");
  walker2.speedX = -5
}
  if (event.which === KEY.D) {
  console.log("right pressed");
  walker2.speedX = 5
}
  if (event.which === KEY.W) {
  console.log("up pressed");
  walker2.speedY = -5
}
  if (event.which === KEY.S) {
  console.log("down pressed");
  walker2.speedY = 5
  }
  }
function handleKeyUp(event){
  if(event.which === KEY.LEFT){
    console.log("stop?");
    walker.speedX = 0
  }
   if(event.which === KEY.RIGHT){
    console.log("stop?");
    walker.speedX = 0
   }
    if(event.which === KEY.UP){
    console.log("stop?");
    walker.speedY = 0
    }
     if(event.which === KEY.DOWN){
    console.log("stop?");
    walker.speedY = 0
     }
     if(event.which === KEY.D){
    console.log("stop?");
    walker2.speedX = 0
  }
   if(event.which === KEY.A){
    console.log("stop?");
    walker2.speedX = 0
   }
    if(event.which === KEY.W){
    console.log("stop?");
    walker2.speedY = 0
    }
     if(event.which === KEY.S){
    console.log("stop?");
    walker2.speedY = 0
     }
}
function changeColour(event){
  var randomColor = "#d04a4aff".replace(/0/g, function meow() {
  return (~~(Math.random() * 16)).toString(16);
});
}

  ////////////////////////////////////////////////////////////////////////////////
  ////////////////////////// HELPER FUNCTIONS ////////////////////////////////////
  ////////////////////////////////////////////////////////////////////////////////

  
  function endGame() {
    // stop the interval timer
    clearInterval(interval);

    // turn off event handlers
    $(document).off();
  }
  function repositionGameItem(){
    walker.x = walker.speedX + walker.x;
    walker.y = walker.speedY + walker.y;
    walker2.x = walker2.speedX + walker2.x;
    walker2.y = walker2.speedY + walker2.y;
  }
  function redrawGameItem(){
    $("#walker").css("left", walker.x)
    $("#walker").css("top", walker.y)
    $("#walker2").css("top", walker2.y)
    $("#walker2").css("left", walker2.x)
  }
  function wallCollision(){
  if(walker.x >= $("#board").width() - 50 ||
    walker.x <= 0){
    walker.x -= walker.speedX;
 }
  if(walker.y >= $("#board").height() - 50 ||
    walker.y <= 0){
    walker.y -= walker.speedY;
    }
    if(walker2.x >= $("#board").width() - 50 ||
    walker2.x <= 0){
    walker2.x -= walker2.speedX;
    }
    if(walker2.y >= $("#board").height() - 50 ||
    walker2.y <= 0){
    walker2.y -= walker2.speedY;
    }
 }
}

