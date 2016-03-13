;(function($) {
	//ENTRY POINT. Start this once the "document" representing the webpage is ready (All HTML elements, or the DOM, have loaded)
	$(document).ready(function() {
		//Use jQuery to retrieve the primary and tracking canvas elements from the page so we can draw to them.
		//Canvas lets you draw with primitive shapes. I'm using one canvas for the primary display, and a separate one
		//for the tracking display, for simplicity.
		var primaryDisplayElem = $("#primaryDisplay"),
			trackingDisplayElem = $("#trackingDisplay");

		//primaryDisplayElem.attr("width", primaryDisplayElem.width()).attr("height", primaryDisplayElem.height());
		//trackingDisplayElem.attr("width", trackingDisplayElem.width()).attr("height", trackingDisplayElem.height());

		//Create a new instance of the PrimaryDisplay class, passing it the canvas element for the
		//primary display.
		var primaryDisplay = new PrimaryDisplay(primaryDisplayElem);

		//Create a new instance of the TrackingDisplay class, passing it the canvas element for the
		//tracking display.
		var trackingDisplay = new TrackingDisplay(trackingDisplayElem);

		//Create a new game instance, passing it the PrimaryDisplay instance and the TrackingDisplay instance it
		//needs to communicate with while the game is running.
		var game = new BattleshipGame(primaryDisplay, trackingDisplay);
		window.game = game;

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

	//Various states of each cell in a grid
	var CELL_STATES = {
		EMPTY: 0,
		MISS: 1,
		SHIP: 3,
		HIT: 4
	};

	//Constructor function for BattleshipGame "class"
	function BattleshipGame(primaryDisplay, trackingDisplay) {
		//"this" refers to the current instance of whatever function Type we're currently in.
		//The following lines are declaring, and populating two member variables on this BattleshipGame instance.
		//The "type" of each of variable would be a 
		this.primaryDisplay = primaryDisplay;
		this.trackingDisplay = trackingDisplay;

		//Target FPS = 60
		//Framelength = Length of 1 second / Target FPS
		//Framelength = Size of each 60th chunk of a second. One frame should be drawn for
		//each of these chunks to reach the target FPS.
		this.frameLength = 1000.0 / 60.0;

		//Set the game's current state to INITIALIZING
		this.state = GAME_STATES.INITIALIZING;
	}

	//Sets up "methods" for BattleshipGame "class"
	BattleshipGame.prototype = {
		update: function(delta) {
			//This will be always be called immediately before the "render" function.
			//"delta" represents the time that has passed since the last time the update function was called, in milliseconds.
			//This is useful in ensuring the game (animations especially) runs at the same speed for every player, regardless of framerate, 
			//because we can base our updates on the real amount of time that has passed while the game was running.

		},
		render: function() {
			//Since this game only consists of two gridded displays, our only render code here is to tell both of
			//those displays to render their contents.
			this.primaryDisplay.render();
			this.trackingDisplay.render();
		},
		start: function() {
			//Don't do anything if this is called when the game is already running.
			if (this.state !== GAME_STATES.RUNNING) {
				//If this is the first time the game has "started", initialize both displays.
				if (this.state === GAME_STATES.INITIALIZING) {
					this.primaryDisplay.init();
					this.trackingDisplay.init();
				}

				//Set the game state to "running".
				this.state = GAME_STATES.RUNNING;

				//requestAnimationFrame is a standard function provided by the browser.
				//It takes in a reference to a function, and it calls this function when the
				//BROWSER is ready to render its next frame. Our game should run more smoothly using this than
				//if we were to use the window.setInterval or window.setTimeout functions to tell the game up update
				//every X milliseconds.
				//Instead, we'll update our game in sync with the browser's update/render cycle, and just
				//detect the time that has passed since our last frame on each frame to keep animations in our
				//game real-time.
				//Also important, "bind" is a function that exists on any function.
				//It returns the function that it was called on after setting that function's context to the variable passed to it.
				//In essense, I'm saying: "Hey browser, run this function the next time you're going to render a frame, and make sure it's running 
				//AS IF it were a method on this particular BattleshipGame instance.".
				//It's going to execute "draw" as if it were a method on the current BattleshipGame instance, by binding any reference to the 
				//variable "this" inside that function to the current BattleshipGame instance.
				requestAnimationFrame(this.draw.bind(this));
			}
		},
		pause: function() {
			this.state = GAME_STATES.PAUSED;
		},
		draw: function(timestamp) {
			if ($.type(this.lastFrameTime) === "undefined") {
				//This is only executed once, due to the above condition, and it sets the "lastFrameTime" to the 
				//current time in milliseconds.
				this.lastFrameTime = timestamp;
			}
			//Calculates the time that has passed since the last frame was drawn, in milliseconds
			var delta = timestamp - this.lastFrameTime;
			
			//If the time that has passed since the last frame is longer than our
			//frame length, then render the next frame.
			if (delta > this.frameLength) {
				//Keep track of the time this frame was rendered.
				//We need to keep track of this regardless of whether the game is "running" so
				//that pausing the game works properly. Otherwise, the game would stop drawing when paused,
				//but would update itself based on the time passed since it was paused when it is unpaused.
				this.lastFrameTime = timestamp;

				//If we're currently running, then update the game based on the time passed, and render a frame.
				if (this.state === GAME_STATES.RUNNING) {
					this.update(delta);
					this.render();
				}
			}
			
			//This tells the browser to queue the next frame to be rendered. Essentially, this is the "do" part of a "do while" game loop
			requestAnimationFrame(this.draw.bind(this));
		}
	};

	//Constructor function for PrimaryDisplay "class"
	function PrimaryDisplay($display) {
		//Keep track of the HTML canvas element
		this.$display = $display;
		
		//Grab the "2d" context for drawing. We'll need this later for our actual draw calls.
		//There are other contexts, such as a WebGL context, but those are more complicated than what we need.
		this.drawContext = $display[0].getContext('2d');

		//Grab the dimensions of our display element on load
		this.width = $display.width();
		this.height = $display.height();

		//Determine which axis is the constraining axis for this canvas so we can ensure our displays are squares.
		if (this.width < this.height) {
			this.height = this.width;
		} else {
			this.width = this.height;
		}

		//Apply the newly determined dimensions.
		$display.width(this.width).height(this.height).attr("width", this.width).attr("height", this.height);

		//Multidimensional array of values from the CELL_STATE variable representing the state of each cell.
		this.gridState = [];

		//Multidimensional array of any values. Used just to contain data related to each cell. At the moment, this only used
		//to specify the type of ship in a "SHIP" cell.
		this.gridData = [];

		//Initialization flag. Could have used an "enum-ish" variable as in the BattleshipGame class, but this only needs two states so this is simpler.
		this.hasInit = false;
	}

	//Sets up "methods" for PrimaryDisplay "class"
	PrimaryDisplay.prototype = {
		//INIT method.
		init: function() {
			var self = this;
			//Only initialize once
			if (!this.hasInit) {
				//Initialize gridState and gridData member variables
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

				//Fill in the game grid with ships based on the default ship configuration. Look below for the placeShips definition.
				var shipsConfiguration = placeShips(DEFAULT_SHIP_CONFIGURATION);

				//Now we need to update the gridState and gridData variables.
				//Iterate through each of the ship configurations returned by placeShips
				$.each(shipsConfiguration, function(i, shipConfiguration) {
					//We'll place the ship into the grid by starting at it's position (topleft-most portion of ship), and
					//based on the ships orientation, repeatedly move one cell right or down for the length of the ship.
					
					//This first step determines the direction we need to move from the ships position.
					var directionToScan;
					if (shipConfiguration.orientation === ORIENTATIONS.HORIZONTAL) {
						directionToScan = DIRECTIONS.RIGHT;
					} else if (shipConfiguration.orientation === ORIENTATIONS.VERTICAL) {
						directionToScan = DIRECTIONS.DOWN;
					}

					//For the length of the ship
					for (var j = 0; j < shipConfiguration.length; j++) {
						//Find the cell position of the next portion of the ship. shipConfiguration.position always repesents the topleft-most cell of
						//a ship.
						//vectorMultByScalar multiplies a given 2D-vector by a given scalar value.
						/*
							GIVEN: directionToScan = [0, 1], and j = 3
							vectorMultByScalar(directionToScan, j) => [0, 3]

							GIVEN: vector1 = [2, 3], vector2 = [1, 5];
							vectorAdd(vector1, vector2) => [3, 8]
						*/
						var currentPosition = vectorAdd(shipConfiguration.position, vectorMultByScalar(directionToScan, j));

						//Set the state of the current cell to SHIP
						self.gridState[currentPosition[0]][currentPosition[1]] = CELL_STATES.SHIP;

						//Specify which type of ship is at this cell via the gridData variable
						self.gridData[currentPosition[0]][currentPosition[1]] = shipConfiguration.code;
					}
				});

				//Switch the hasInit flag so the init function cannot run more than once.
				this.hasInit = true;
			}
		},
		render: function() {
			//Only attempt to render if we've fully initialized
			if (this.hasInit) {
				//Erase every pixel with a square that starts at the top left-corner, and stretches to the bottom-right corner of the canvas.
				//Effectively erasing the entire canvas.
				this.drawContext.clearRect(0, 0, this.width, this.height);

				//Specify which font we want to use in our next "Text" related draw call.
				this.drawContext.font = "13px arial";

				//Draw the "Primary Display" text that shows up above the primary grid.
				//fillText(<TEXT_TO_DISPLAY:STRING>, <X_POSITION:NUMBER>, <Y_POSITION:NUMBER>)
				this.drawContext.fillText("Primary Display", this.width / 2 - 50, 15);

				//Call the custom drawGrid function (defined below) to draw the grid background.
				//drawGrid(<DRAW_CONTEXT:CanvasRenderingContext2D>, <X_POSITION:NUMBER>, <Y_POSITION:NUMBER>, <WIDTH:NUMBER>, <HEIGHT:NUMBER>, <PADDING:NUMBER>, <BACKGROUND_COLOR:STRING>, <GRID_LINE_COLOR:STRING>)
				drawGrid(this.drawContext, 0, 0, this.width, this.height, 20, "#1C6BA0", "black");
				
				//Call the custom drawGridContents function (defined below) to draw any ships/miss markers/hit markers
				//drawGridContents(<DRAW_CONTEXT:CanvasRenderingContext2D>, <X_POSITION:NUMBER>, <Y_POSITION:NUMBER>, <WIDTH:NUMBER>, <HEIGHT:NUMBER>, <PADDING:NUMBER>, <GRID_STATE:JS_OBJECT>, <GRID_DATA:JS_OBJECT>)
				drawGridContents(this.drawContext, 0, 0, this.width, this.height, 20, this.gridState, this.gridData);
			}
		}
	};

	//Constructor function for TrackingDisplay "class"
	function TrackingDisplay($display) {
		//Store the canvas element for this display
		this.$display = $display;

		//Retrieve and store the 2d drawing context for this canvas
		this.drawContext = $display[0].getContext('2d');

		//Store the dimensions of the current display element.
		this.width = $display.width();
		this.height = $display.height();

		//Determine which axis is the constraining axis for this canvas so we can ensure our displays are squares.
		if (this.width < this.height) {
			this.height = this.width;
		} else {
			this.width = this.height;
		}

		//Apply the new dimensions
		$display.height(this.height).width(this.width).attr("width", this.width).attr("height", this.height);

		//Multidimensional array of values from the CELL_STATE variable representing the state of each cell.
		this.gridState = [];

		//Multidimensional array of any values. Used just to contain data related to each cell. At the moment, this only used
		//to specify the type of ship in a "SHIP" cell.
		this.gridData = [];

		//Declare the hasInit flag, for controlling when the initialization logic fires
		this.hasInit = false;
	}

	//Sets up "methods" for TrackingDisplay "class"
	TrackingDisplay.prototype = {
		init: function() {
			if (!this.hasInit) {
				//Initialize the gridState and gridData variables
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

				//Toggle the hasInit flag, so this logic only runs once
				this.hasInit = true;
			}
		},
		render: function() {
			//Only render this display if it has been initialized
			if (this.hasInit) {
				//Clear the canvas
				this.drawContext.clearRect(0, 0, this.width, this.height);

				//Specify the font to use for our next "text" draw call
				this.drawContext.font = "13px arial";

				//Draw the text "Tracking Display" above the grid
				this.drawContext.fillText("Tracking Display", this.width / 2 - 50, 15);

				//Draw the grid background
				drawGrid(this.drawContext, 0, 0, this.width, this.height, 20, "black", "green");

				//Draw any foremost elements, such as ship letters and hit/miss markers
				drawGridContents(this.drawContext, 0, 0, this.width, this.height, 20, this.gridState, this.gridData);
			}
		}
	};


	function drawGrid(drawContext, x, y, width, height, padding, backgroundColor, strokeColor) {
		//Ensure this function was called with a valid drawContext variable
		if (drawContext) {
			//Specify default values for any variables used in this call.
			//The syntax is much simpler than a series of if/else blocks, and it works as follows:
			//x is equal to itself, or 0 if x is falsy (undefined, null, 0, "")
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

			//Detect the current cell size
			var cellSize = [width / GRID_SIZE, height / GRID_SIZE];

			//Store the current fillStyle and strokeStyle so we can restore them when we're done.
			//This is a common practive when dealing with this sort of renderer. Effectively the same as a state stack.
			var oldFillStyle = drawContext.fillStyle;
			var oldStrokeStyle = drawContext.strokeStyle;

			//Configure our drawing settings before making any draw calls
			drawContext.fillStyle = backgroundColor;
			drawContext.strokeStyle = strokeColor;
			drawContext.lineWidth = 2;

			//Draw the background of the grid
			drawContext.fillRect(x, y, width, height);

			//Draw the grid border
			drawContext.strokeRect(x, y, width, height);

			//Set the line width back to 1 for the grid lines
			drawContext.lineWidth = 1;

			//We'll draw the grid lines in as little paths as we can. In this case, there's no reason to 
			//separate the grid lines up into more than one path, so we'll use one.

			//Initialize a new path
			drawContext.beginPath();

			//Draw in the grid lines from the top-left corner to the bottom-right corner
			for (var gridCounter = 1; gridCounter < GRID_SIZE; gridCounter++) {
				//Determine the horizontal position of the new vertical line, and the vertical position of the new horizontal line
				//since we're handling the lines in pairs depending on their distance from the top-left corner.
				var horizontalLinePosition = x + cellSize[0] * gridCounter;
				var verticalLinePosition = y + cellSize[1] * gridCounter;
				
				//Pick up the pen, and move it to the horizontal position for the new vertical line
				drawContext.moveTo(horizontalLinePosition, y);

				//Place the pen on the paper, and move it to the bottom of the grid. This completes this vertical line.
				drawContext.lineTo(horizontalLinePosition, y + height);

				//Pick up the pen, and move it to the vertical position for the new horizontal line
				drawContext.moveTo(x, verticalLinePosition);

				//Place the pen on the paper, and move it to the right of the grid. This comletes the horizontal line.
				drawContext.lineTo(x + width, verticalLinePosition);
			}

			//Finalize this path by drawing it to the canvas
			drawContext.stroke();

			//Restore the fillStyle and strokeStyle settings
			drawContext.fillStyle = oldFillStyle;
			drawContext.strokeStyle = oldStrokeStyle;
		}
	}

	//drawGridContents(this.drawContext, 0, 0, this.width, this.height, 20, gridState, gridData);
	function drawGridContents(drawContext, x, y, width, height, padding, gridState, gridData) {
		if (drawContext) {
			//Apply default values
			x = x || 0;
			y = y || 0;
			width = width || 100;
			height = height || 100;
			padding = padding || 0;
			x = x + padding;
			y = y + padding;
			width = width - 2 * padding;
			height = height - 2 * padding;

			//Determine the cell size
			var cellSize = [width / GRID_SIZE, height / GRID_SIZE];

			//Iterate through each cell in the grid, row by row outer, and cell by cell inner
			for (var xCounter = 0; xCounter < GRID_SIZE; xCounter++) {
				for (var yCounter = 0; yCounter < GRID_SIZE; yCounter++) {
					//Get the state of the current cell so we can determine what to draw here
					var cellState = gridState[xCounter][yCounter];

					//If the cell is not empty
					if (cellState !== CELL_STATES.EMPTY) {
						//Get the pixel position of the top-left corner of the current cell
						var cellX = x + xCounter * cellSize[0];
						var cellY = y + yCounter * cellSize[1];

						//If this cell is a "MISS" cell, draw the splash marker
						if (cellState === CELL_STATES.MISS) {
							drawSplash(drawContext, cellX, cellY, cellSize[0], cellSize[1]);
						} else {
							//If this is not a "MISS" cell, then it must either be a ship cell or a hit cell.
							//Either way, we need to draw the ship first.
							drawShip(drawContext, cellX, cellY, cellSize[0], cellSize[1], gridData[xCounter][yCounter]);
							
							//If this cell happens to be a "HIT" cell, draw the hit marker on top of the ship
							if (cellState === CELL_STATES.HIT) {
								drawHit(drawContext, cellX, cellY, cellSize[0], cellSize[1]);
							}
						}
					}
				}
			}
		}
	}

	//Draws a white X over the cell
	function drawSplash(drawContext, x, y, width, height) {
		var oldStrokeStyle = drawContext.strokeStyle;
		drawContext.strokeStyle = "white";

		//Initialize the new path
		drawContext.beginPath();

		//Place the pen at the top-left corner of the cell
		drawContext.moveTo(x, y);

		//Move the pen to the bottom-right corner of the cell
		drawContext.lineTo(x + width, y + height);

		//Place the pen at the top-right corner of the cell
		drawContext.moveTo(x + width, y);

		//Move the pen to the bottom-left corner of the cell
		drawContext.lineTo(x, y + height);

		//Finalize the path and draw it to the canvas
		drawContext.stroke();

		//Restore the old stroke style
		drawContext.strokeStyle = oldStrokeStyle;
	}

	function drawShip(drawContext, x, y, width, height, shipCode) {
		var oldFillStyle = drawContext.fillStyle;
		drawContext.fillStyle = "white";

		//Draw the ship's code in the "center" of the cell (approximated the position here rather than calculating it)
		drawContext.fillText(shipCode, x + width / 2 - 5, y + height / 2 + 5);

		//Restore the old fillStyle
		drawContext.fillStyle = oldFillStyle;
	}

	function drawHit(drawContext, x, y, width, height) {
		var oldStrokeStyle = drawContext.strokeStyle;
		drawContext.strokeStyle = "red";
		
		//Same draw logic as the splash marker, but in red
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
			//Handles generating multiple copies of the same ship, in the case of the smaller ones
			for (var i = 0; i < shipDetails.quantity; i++) {
				//Randomly pick a orientation for the ship
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

			//isShipCollidingWithAny checks if the given ship is colliding with any of the ships (other than itself) in ships.
			//So here, as long as the ship is still colliding with another ship, the game will continue nudging it around
			while (isShipCollidingWithAny(ship, ships)) {
				//Randomly pick a direction to nudge the ship
				var nudgeDirectionVector = DIRECTIONS[randomInRange(0, 3)];

				//Randomly pick a distance to nudge the ship in the chosen direction
				var nudgeVector = vectorMultByScalar(nudgeDirectionVector, randomInRange(0, GRID_SIZE - 1));

				//If the random movement is within the grid, move the ship there
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
			//Checks if the current bounds are equal to the smallest possible bounds
			if (minBounds[0] === currentBounds[0] && minBounds[1] === currentBounds[1] || 
				//Handles the edge case of two ships being parallel to each other and placed end-to-end
				(currentBounds[0] * currentBounds[1] < ship1.length + ship2.length)) {
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