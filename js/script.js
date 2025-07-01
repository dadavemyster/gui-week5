/*
File: script.js
GUI Assignment: HW5 - Scrabble
David Boulos, UML C.S., David_Boulos@student.uml.edu
Copyright (c) 2025 by David.  All rights reserved.  May be freely copied or 
excerpted for educational purposes with credit to the author. 
Updated by DB on June 30th, 2025 at 10:45 PM
*/

// JavaScript Document
let fullTileSet = [];

// Load JSON and populate fullTileSet
$.getJSON("data/pieces.json", function(data) {
  const pieces = data.pieces;
  
  // Flatten the distribution based on `amount`
  pieces.forEach(tile => {
    for (let i = 0; i < tile.amount; i++) {
      fullTileSet.push({ letter: tile.letter, points: tile.value });
    }
  });

  // Shuffle and draw initial rack
  fullTileSet = shuffleArray(fullTileSet);
  dealTiles(7);
});

function shuffleArray(array) {
  return array.sort(() => Math.random() - 0.5);
}

function dealTiles(num) {
  for (let i = 0; i < num && fullTileSet.length; i++) {
    const tile = fullTileSet.pop();
    const tileEl = createTile(tile.letter, tile.points);
    $("#rack").append(tileEl);
  }
}

function createTile(letter, points) {
	const tileEl = $(`
		<div class="tile" data-letter="${letter}" data-points="${points}">
			<img src="images/Scrabble_Tile_${letter}.jpg" alt="${letter}">
		</div>
	`);
	tileEl.draggable({
    	revert: "invalid",
    	containment: "#main-game-area",
		scroll: false,
		stack: ".tile"
  	});
	
	return tileEl;
}

$("#rack").droppable({
  accept: ".tile",
  drop: function(event, ui) {
    const $tile = ui.draggable;
    const $oldSquare = $tile.parent(".square");

    if ($oldSquare.length) {
      $oldSquare.data("occupied", false);
    }

    $(this).append($tile.css({ top: 0, left: 0, position: "relative" }));
    validateWordLive();
  }
});


$(".square").droppable({
  accept: ".tile",
  tolerance: "intersect",
  drop: function(event, ui) {
    const $square = $(this);
    const $tile = ui.draggable;

    // If tile was on another square, free it
    const $oldSquare = $tile.parent(".square");
    if ($oldSquare.length && $oldSquare[0] !== $square[0]) {
      $oldSquare.data("occupied", false);
    }

    // Reject if this square is already taken
    if ($square.data("occupied")) return;

    $square.data("occupied", true);
    $tile.css({ top: 0, left: 0, position: "absolute", zIndex: 10 });
    $square.append($tile);
    $tile.position({
      of: $square,
      my: "center",
      at: "center"
    });
	  
    validateWordLive();
  },
  out: function(event, ui) {
    // When a tile is dragged off, clear occupancy
    $(this).data("occupied", false);
  }
  
});

$("#resetButton").click(function() {
  resetBoard();
});


function resetBoard() {
  // Remove all tiles from board squares
  $(".square").each(function() {
    $(this).data("occupied", false).empty();
  });

  // Remove all tiles from rack
  $("#rack").empty();

  // Refill rack with fresh 7 tiles
  dealTiles(7);
  validateWordLive();
  $("#feedback").text("");
}

let currentScore = 0;

function updateScore() {
  let baseScore = 0;
  let wordMultiplier = 1;

  $(".square").each(function () {
    const $tile = $(this).find(".tile");
    if ($tile.length) {
      const points = parseInt($tile.data("points"));
      const multiplier = $(this).data("multiplier");

      if (multiplier === "DW") {
        wordMultiplier *= 2; // Stack if more than one DW
        baseScore += points;
      } else {
        baseScore += points * parseInt(multiplier); // letter multiplier
      }
    }
  });

  const totalScore = baseScore * wordMultiplier;
  $("#score").text(totalScore);
}

function getCurrentWord() {
  let word = "";
  $(".square").each(function () {
    const $tile = $(this).find(".tile");
    word += $tile.length ? $tile.data("letter") : "";
  });
  return word.toUpperCase();
}

function validateWordLive() {
  const word = getCurrentWord();

  if (!word || hasGapsInWord()) {
    $("#score").text("0");
    $("#feedback").text("❌ Incomplete word — tiles must be placed consecutively.").css("color", "red");
    return;
  }

  $.get(`https://api.datamuse.com/words?sp=${word}&max=1`, function (data) {
    const isValid = data.length && data[0].word.toUpperCase() === word;

    if (isValid) {
      updateScore();
      $("#feedback").text(`✅ "${word}" is valid!`).css("color", "green");
    } else {
      $("#score").text("0");
      $("#feedback").text(`❌ "${word}" is not valid.`).css("color", "red");
    }
  });
}


function hasGapsInWord() {
  const tileStates = $(".square").map(function () {
    return $(this).find(".tile").length > 0;
  }).get();

  // Find index of first and last tile
  const firstTileIndex = tileStates.indexOf(true);
  const lastTileIndex = tileStates.lastIndexOf(true);

  if (firstTileIndex === -1) return true; // No tiles

  // Check for any empty square between first and last tile
  for (let i = firstTileIndex; i <= lastTileIndex; i++) {
    if (!tileStates[i]) return true; // Found a gap
  }

  return false;
}







