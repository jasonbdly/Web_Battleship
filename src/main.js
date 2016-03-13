;(function($) {
	//ENTRY POINT. Start this once the "document" representing the webpage is ready (All HTML elements, or the DOM, have loaded)
	$(document).ready(function() {
		//Use jQuery to retrieve the primary and tracking canvas elements from the page so we can draw to them.
		//Canvas lets you draw with primitive shapes. I'm using one canvas for the primary display, and a separate one
		//for the tracking display, for simplicity.
		var primaryDisplayElem = $("#primaryDisplay"),
			trackingDisplayElem = $("#trackingDisplay");

		primaryDisplayElem.attr("width", primaryDisplayElem.width()).attr("height", primaryDisplayElem.height());
		trackingDisplayElem.attr("width", trackingDisplayElem.width()).attr("height", trackingDisplayElem.height());

		//Create a new instance of the PrimaryDisplay class, passing it the canvas element for the
		//primary display.
		var primaryDisplay = new PrimaryDisplay(primaryDisplayElem);

		//Create a new instance of the TrackingDisplay class, passing it the canvas element for the
		//tracking display.
		var trackingDisplay = new TrackingDisplay(trackingDisplayElem);

		//Create a new game instance, passing it the PrimaryDisplay instance and the TrackingDisplay instance it
		//needs to communicate with while the game is running.
		var game = new BattleshipGame(primaryDisplay, trackingDisplay);

		//Start the game
		game.start();
	});

	//Static variables used throughout code. Global-ish variables.
	var GAME_STATES = {
		INITIALIZING: 0,
		RUNNING: 1,
		PAUSED: 2
	};

	var GRID_SIZE = 10;

	var ORIENTATIONS = {
		VERTICAL: "v",
		HORIZONTAL: "h"
	};

	//Useful for randomly picking a direction simply by generating a number between [0 and 2).
	ORIENTATIONS[0] = ORIENTATIONS.VERTICAL;
	ORIENTATIONS[1] = ORIENTATIONS.HORIZONTAL;

	//Coordinate system for canvas starts at the top left, so up and down are reversed.
	var DIRECTIONS = {
		UP: [0, -1],
		RIGHT: [1, 0],
		DOWN: [0, 1],
		LEFT: [-1, 0]
	};

	//Useful for iterating through available options
	DIRECTIONS[0] = DIRECTIONS.UP;
	DIRECTIONS[1] = DIRECTIONS.RIGHT;
	DIRECTIONS[2] = DIRECTIONS.DOWN;
	DIRECTIONS[3] = DIRECTIONS.LEFT;

	//Default ship piece configuration
	var DEFAULT_SHIP_CONFIGURATION = {
		carrier: {
			length: 5,
			code: "A",
			quantity: 1
		},
		battleship: {
			length: 4,
			code: "B",
			quantity: 1
		},
		cruiser: {
			length:3,
			code: "C",
			quantity: 2
		},
		submarine: {
			length: 3,
			code: "S",
			quantity: 2
		},
		patrol: {
			length: 2,
			code: "P",
			quantity: 3
		}
	};

	var CELL_STATES = {
		EMPTY: 0,
		MISS: 1,
		SHIP: 3,
		HIT: 4
	};

	//Constructor function for BattleshipGame "class"
	function BattleshipGame(primaryDisplay, trackingDisplay) {
		this.primaryDisplay = primaryDisplay;
		this.trackingDisplay = trackingDisplay;

		//Target FPS = 60
		//Framelength = Length of 1 second / Target FPS
		//Framelength = Size of each 60th chunk of a second. One frame should be drawn for
		//each of these chunks to reach the target FPS.
		this.frameLength = 1000.0 / 60.0;

		this.state = GAME_STATES.INITIALIZING;
	}

	//Sets up "methods" for BattleshipGame "class"
	BattleshipGame.prototype = {
		update: function(delta) {

		},
		render: function() {
			this.primaryDisplay.render();
			this.trackingDisplay.render();
		},
		start: function() {
			if (this.state !== GAME_STATES.RUNNING) {
				if (this.state === GAME_STATES.INITIALIZING) {
					this.primaryDisplay.init();
					this.trackingDisplay.init();
				}
				this.state = GAME_STATES.RUNNING;
				requestAnimationFrame(this.draw.bind(this));
			}
		},
		pause: function() {
			this.state = GAME_STATES.PAUSED;
		},
		draw: function(timestamp) {
			if ($.type(this.lastFrameTime) === "undefined") {
				this.lastFrameTime = timestamp;
			}
			var delta = timestamp - this.lastFrameTime;
			
			//If the time that has passed since the last frame is longer than our
			//frame length, then render the next frame.
			if (delta > this.frameLength) {
				this.lastFrameTime = timestamp;

				if (this.state === GAME_STATES.RUNNING) {
					this.update(delta);
					this.render();
				}
			}
			//requestAnimationFrame(this.draw);
			requestAnimationFrame(this.draw.bind(this));
		}
	};

	//Constructor function for PrimaryDisplay "class"
	function PrimaryDisplay($display) {
		this.$display = $display;
		this.drawContext = $display[0].getContext('2d');
		this.width = $display.width();
		this.height = $display.height();
		this.hasInit = false;
	}

	//Sets up "methods" for PrimaryDisplay "class"
	PrimaryDisplay.prototype = {
		init: function() {
			if (!this.hasInit) {
				//Initialize grid state
				var gridState = [];
				var gridData = [];
				for (var xCounter = 0; xCounter < GRID_SIZE; xCounter++) {
					var newRow = [];
					var newDataRow = [];
					for (var yCounter = 0; yCounter < GRID_SIZE; yCounter++) {
						newRow.push(CELL_STATES.EMPTY);
						newDataRow.push(null);
					}
					gridState.push(newRow);
					gridData.push(newDataRow);
				}
				//Fill in the game grid with ships based on the default ship configuration
				var shipsConfiguration = placeShips(DEFAULT_SHIP_CONFIGURATION);

				//Now we need to update the gridState and gridData variables
				$.each(shipsConfiguration, function(i, shipConfiguration) {
					var directionToScan;
					if (shipConfiguration.orientation === ORIENTATIONS.HORIZONTAL) {
						directionToScan = DIRECTIONS.RIGHT;
					} else if (shipConfiguration.orientation === ORIENTATIONS.VERTICAL) {
						directionToScan = DIRECTIONS.DOWN;
					}

					for (var j = 0; j < shipConfiguration.length; j++) {
						var currentPosition = vectorAdd(shipConfiguration.position, vectorMultByScalar(directionToScan, j));
						gridState[currentPosition[0]][currentPosition[1]] = CELL_STATES.SHIP;
						gridData[currentPosition[0]][currentPosition[1]] = shipConfiguration.code;
					}
				});

				this.gridState = gridState;
				this.gridData = gridData;

				this.hasInit = true;
			}
		},
		render: function() {
			if (this.hasInit) {
				this.drawContext.clearRect(0, 0, this.width, this.height);
				this.drawContext.font = "12px arial";
				this.drawContext.fillText("Primary Display", this.width / 2 - 35, 15);
				drawGrid(this.drawContext, 0, 0, this.width, this.height, 20, "#1C6BA0", "black");
				drawGridContents(this.drawContext, 0, 0, this.width, this.height, 20, this.gridState, this.gridData);
			}
		}
	};

	//Constructor function for TrackingDisplay "class"
	function TrackingDisplay($display) {
		this.$display = $display;
		this.drawContext = $display[0].getContext('2d');
		this.width = $display.width();
		this.height = $display.height();
		this.gridState = [];
		this.gridData = [];
		this.hasInit = false;
	}

	//Sets up "methods" for TrackingDisplay "class"
	TrackingDisplay.prototype = {
		init: function() {
			if (!this.hasInit) {
				for (var xCounter = 0; xCounter < GRID_SIZE; xCounter++) {
					var newRow = [];
					var newDataRow = [];
					for (var yCounter = 0; yCounter < GRID_SIZE; yCounter++) {
						newRow.push(CELL_STATES.EMPTY);
						newDataRow.push(null);
					}
					this.gridState.push(newRow);
					this.gridData.push(newDataRow);
				}
				this.hasInit = true;
			}
		},
		render: function() {
			if (this.hasInit) {
				this.drawContext.clearRect(0, 0, this.width, this.height);
				this.drawContext.font = "12px arial";
				this.drawContext.fillText("Tracking Display", this.width / 2 - 35, 15);
				drawGrid(this.drawContext, 0, 0, this.width, this.height, 20, "black", "green");
				drawGridContents(this.drawContext, 0, 0, this.width, this.height, 20, this.gridState, this.gridData);
			}
		}
	};


	function drawGrid(drawContext, x, y, width, height, padding, backgroundColor, strokeColor) {
		if (drawContext) {
			x = x || 0;
			y = y || 0;
			width = width || 100;
			height = height || 100;
			padding = padding || 0;
			x = x + padding;
			y = y + padding;
			width = width - 2 * padding;
			height = height - 2 * padding;
			backgroundColor = backgroundColor || "white";
			strokeColor = strokeColor || "black";

			var cellSize = [width / GRID_SIZE, height / GRID_SIZE];

			var oldFillStyle = drawContext.fillStyle;
			var oldStrokeStyle = drawContext.strokeStyle;

			drawContext.fillStyle = backgroundColor;
			drawContext.strokeStyle = strokeColor;
			drawContext.lineWidth = 2;
			drawContext.fillRect(x, y, width, height);
			drawContext.strokeRect(x, y, width, height);

			drawContext.lineWidth = 1;

			drawContext.beginPath();
			for (var gridCounter = 1; gridCounter < GRID_SIZE; gridCounter++) {
				var horizontalLinePosition = x + cellSize[0] * gridCounter;
				var verticalLinePosition = y + cellSize[1] * gridCounter;
				
				drawContext.moveTo(horizontalLinePosition, y);
				drawContext.lineTo(horizontalLinePosition, y + height);

				drawContext.moveTo(x, verticalLinePosition);
				drawContext.lineTo(x + width, verticalLinePosition);
			}
			drawContext.stroke();

			drawContext.fillStyle = oldFillStyle;
			drawContext.strokeStyle = oldStrokeStyle;
		}
	}

	//drawGridContents(this.drawContext, 0, 0, this.width, this.height, 20, gridState, gridData);
	function drawGridContents(drawContext, x, y, width, height, padding, gridState, gridData) {
		if (drawContext) {
			x = x || 0;
			y = y || 0;
			width = width || 100;
			height = height || 100;
			padding = padding || 0;
			x = x + padding;
			y = y + padding;
			width = width - 2 * padding;
			height = height - 2 * padding;

			var cellSize = [width / GRID_SIZE, height / GRID_SIZE];

			for (var xCounter = 0; xCounter < GRID_SIZE; xCounter++) {
				for (var yCounter = 0; yCounter < GRID_SIZE; yCounter++) {
					var cellState = gridState[xCounter][yCounter];
					if (cellState !== CELL_STATES.EMPTY) {
						var cellX = x + xCounter * cellSize[0];
						var cellY = y + yCounter * cellSize[1];

						if (cellState === CELL_STATES.MISS) {
							drawSplash(drawContext, cellX, cellY, cellSize[0], cellSize[1]);
						} else {
							drawShip(drawContext, cellX, cellY, cellSize[0], cellSize[1], gridData[xCounter][yCounter]);
							if (cellState === CELL_STATES.HIT) {
								drawHit(drawContext, cellX, cellY, cellSize[0], cellSize[1]);
							}
						}
					}
				}
			}
		}
	}

	function drawSplash(drawContext, x, y, width, height) {
		var oldStrokeStyle = drawContext.strokeStyle;
		drawContext.strokeStyle = "white";
		drawContext.beginPath();
		drawContext.moveTo(x, y);
		drawContext.lineTo(x + width, y + height);
		drawContext.moveTo(x + width, y);
		drawContext.lineTo(x, y + height);
		drawContext.stroke();
		drawContext.strokeStyle = oldStrokeStyle;
	}

	function drawShip(drawContext, x, y, width, height, shipCode) {
		var oldFillStyle = drawContext.fillStyle;
		drawContext.fillStyle = "white";
		drawContext.fillText(shipCode, x + width / 2 - 5, y + height / 2 + 5);
		drawContext.fillStyle = oldFillStyle;
	}

	function drawHit(drawContext, x, y, width, height) {
		var oldStrokeStyle = drawContext.strokeStyle;
		drawContext.strokeStyle = "red";
		drawContext.beginPath();
		drawContext.moveTo(x, y);
		drawContext.lineTo(x + width, y + height);
		drawContext.moveTo(x + width, y);
		drawContext.lineTo(x, y + height);
		drawContext.stroke();
		drawContext.strokeStyle = oldStrokeStyle;
	}

	/*
		INPUT: shipTypes => {
			carrier: {
				length: 5,
				code: "A",
				quantity: 1
			},...
		}

		OUTPUT: [{
			type: "carrier",
			position: [0, 1],
			orientation: "h",
			id: 0
		}, {
			type: "battleship",
			position: [3, 5],
			orientation: "v",
			id: 1
		}]
	*/
	function placeShips(shipTypes) {
		var ships = [];
		//Lets take a place and check approach. Sort of brute force, but it'll do for this application.
		//First, we'll randomly populate the grid with all of our ships.
		//Second, we look for any collisions.
		//If we find any collisions, iteratively "nudge" one of the ships in the first found collision until it fits.
		//Repeat until all ships fit within the grid.

		//First step, randomly place each ship.
		$.each(shipTypes, function(shipType, shipDetails) {
			for (var i = 0; i < shipDetails.quantity; i++) {
				var orientation = ORIENTATIONS[randomInRange(0, 1)];
				var xPosition, yPosition;

				//Generate the position for the new ship
				if (orientation === ORIENTATIONS.HORIZONTAL) {
					//We need to shrink the horizontal range a bit to make sure the piece fits within the grid.
					xPosition = randomInRange(0, GRID_SIZE - shipDetails.length - 1);
					yPosition = randomInRange(0, GRID_SIZE - 1);
				} else if (orientation === ORIENTATIONS.VERTICAL) {
					//We need to shrink the vertical range a bit to make sure the piece fits within the grid.
					xPosition = randomInRange(0, GRID_SIZE - 1);
					yPosition = randomInRange(0, GRID_SIZE - shipDetails.length - 1);
				}

				//Add the generated ship
				ships.push({
					type: shipType,
					code: shipDetails.code,
					position: [xPosition, yPosition],
					orientation: orientation,
					length: shipDetails.length,
					id: ships.length
				});
			}
		});

		//Now that we've fit each ship into the grid, lets search for collisions.
		for (var i = 0; i < ships.length; i++) {
			var ship = ships[i];
			while (isShipCollidingWithAny(ship, ships)) {
				var nudgeDirectionVector = DIRECTIONS[randomInRange(0, 3)];
				var nudgeVector = vectorMultByScalar(nudgeDirectionVector, randomInRange(0, GRID_SIZE - 1));
				if (isMovementValid(ship, nudgeVector)) {
					ship.position = vectorAdd(ship.position, nudgeVector);
				}
			}
		}
		
		return ships;
	}

	function areShipsColliding(ship1, ship2) {
		if (ship1.id !== ship2.id) {
			var minBounds = getMinBounds(ship1, ship2);
			var currentBounds = getCurrentBounds(ship1, ship2);
			if (minBounds[0] === currentBounds[0] && minBounds[1] === currentBounds[1]) {
				return true;
			} else {
				return false;
			}
		} else {
			return false;
		}
	}

	function isShipCollidingWithAny(ship, otherShips) {
		var areColliding = false;
		$.each(otherShips, function(i, otherShip) {
			if (ship.id !== otherShip.id && areShipsColliding(ship, otherShip)) {
				areColliding = true;

				//Equivalent to a break statement in this type of for loop.
				return false;
			}
		});
		return areColliding;
	}

	function isMovementValid(ship, movementVector) {
		var newPosition = [ship.position[0] + movementVector[0], ship.position[1] + movementVector[1]];

		if (newPosition[0] > -1 && newPosition[1] > -1 && newPosition[0] < GRID_SIZE && newPosition[1] < GRID_SIZE) {
			//If the top left corner of the current ship is inside the grid, check to ensure the entire ship is inside the bounds of the grid
			var rightBound = newPosition[0] + (ship.orientation === ORIENTATIONS.HORIZONTAL ?
				ship.length :
				1
			);
			var lowerBound = newPosition[1] + (ship.orientation === ORIENTATIONS.VERTICAL ?
				ship.length :
				1
			);

			if (rightBound < GRID_SIZE && lowerBound < GRID_SIZE) {
				return true;
			}
			return false;
		} else {
			//If the top left corner of the current ship is not inside the grid, return false.
			return false;
		}
	}

	function getCurrentBounds(ship1, ship2) {
		//Lets find our 4 important coordinates for these bounds. These coordinates are the following vectors:
		//<ship1x, ship1y>, <ship2x, ship2y>, <ship1x + ship1width, ship1y + ship2height>, <ship2x + ship2width, ship2y + ship2height>
		//but we don't yet know which are the top left, top right, bottom left, or bottom right coordinates.
		var coordinates = [
			[
				ship1.position[0], ship1.position[1]
			],
			[
				ship2.position[0], ship2.position[1]
			],
			[
				ship1.position[0] + (ship1.orientation === ORIENTATIONS.HORIZONTAL ?
					ship1.length:
					1
				),
				ship1.position[1] + (ship1.orientation === ORIENTATIONS.VERTICAL ?
					ship1.length:
					1
				)
			],
			[
				ship2.position[0] + (ship2.orientation === ORIENTATIONS.HORIZONTAL ?
					ship2.length:
					1
				),
				ship2.position[1] + (ship2.orientation === ORIENTATIONS.VERTICAL ?
					ship2.length:
					1
				)
			]
		];

		//Search through the coordinates and find our highest and lowest bounds in each axis
		var lowX = Infinity, highX = -Infinity, lowY = Infinity, highY = -Infinity;
		$.each(coordinates, function(i, coordinate) {
			if (coordinate[0] < lowX) {
				lowX = coordinate[0];
			} else if (coordinate[0] > highX) {
				highX = coordinate[0];
			}
			if (coordinate[1] < lowY) {
				lowY = coordinate[1];
			} else if (coordinate[1] > highY) {
				highY = coordinate[1];
			}
		});

		//The four variables above can now be used to find the width and height of the current bounds of the specified ships.
		return [highX - lowX, highY - lowY];
	}

	//Return [WIDTH OF WIDEST SHIP, HEIGHT OF LONGEST SHIP]
	//WIDEST: Takes up the most horizontal space
	//LONGEST: Takes up the most vertical space
	function getMinBounds(ship1, ship2) {
		var ship1Dimensions = getShipDimensions(ship1), ship2Dimensions = getShipDimensions(ship2);
		var minBounds = [];
		if (ship1Dimensions[0] > ship2Dimensions[0]) {
			minBounds.push(ship1Dimensions[0]);
		} else {
			minBounds.push(ship2Dimensions[0]);
		}

		if (ship1Dimensions[1] > ship2Dimensions[1]) {
			minBounds.push(ship1Dimensions[1]);
		} else {
			minBounds.push(ship2Dimensions[1]);
		}

		return minBounds;
	}

	function getShipDimensions(ship) {
		if (ship.orientation === ORIENTATIONS.VERTICAL) {
			return [1, ship.length];
		} else {
			return [ship.length, 1];
		}
	}

	function randomInRange(lower, upper) {
		return Math.floor(Math.random() * (upper - lower + 1)) + lower;
	}

	function vectorMultByScalar(vector, scalar) {
		return [vector[0] * scalar, vector[1] * scalar];
	}

	function vectorAdd(vector1, vector2) {
		return [vector1[0] + vector2[0], vector1[1] + vector2[1]];
	}
})(jQuery);