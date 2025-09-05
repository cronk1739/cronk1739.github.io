$(document).ready(function () {
  // Your code goes here
$("<div>")
.css("height", 15)
.css("width", 15)
.css("background-color", "black"
.css("position", "absolute")
.css("top", 42)
.css ("left", 42)
.appendTo("#die")
)

$("#die").on("click", rollDie)


function makeDot(top, left, die){
$("<div»")
.css("height", 15)
.css("width", 15)
.css ("top", top)
.css("left", left)
.css ("background-color", "white")
.css("position", "absolute")
.appendTo(die);
}

function rollDie() {
$("#die"). empty()
var randomNum = Math. ceil (Math. random() * 6);
alert("You rolled a " + randomNum);
if (randomNum = 1) { 
  makeDot (42, 42, "#die"); // middle 
}

else if (randomNum === 2) {
 makeDot (10, 10, "#die") // top left 
 makeDot (75, 75, "#die") // bottom right
}
else if (randomNum === 3) {
  makeDot (10, 10,"#die"); // top left
  makeDot (75, 75, "#die") // bottom right
  makeDot (42, 42, "#die") // middle 
}

else if (randomNum === 4) { 
makeDot (75, 75, "#die"); // bottom right 
makeDot (10, 10,"#die") // top left
makeDot (10, 75, "#die") // top right
makeDot (75, 10, "#die") // bottom left
}

else if (randomNum === 5) {
makeDot (42, 42, "#die"); // middle 
makeDot (75, 75, "#die") // bottom right
makeDot (10, 10, "#die") // top left
makeDot (10, 75, "#die") // top right
makeDot (75, 10, "#die") // bottom left
}

else if (randomNum = 6){
makeDot (75, 75, "#die") // bottom right
makeDot (10, 10, "#die") // top left
makeDot (10, 75, "#die") // top right
makeDot (75, 10, "#die") // bottom left
makeDot (42, 10, "#die") // middle left
makeDot (42, 75, "#die") // bottom left
  }
 } 
});
//* Elijah Was Here! *//