# Web Battleship Prototype Game

## Game Modules
The game logic is divided into three central modules. 
Look for any function definitions with an uppercase name to find them in the code.
They are the following:
1. BattleshipGame
  *Controls most of the logic in the game.
  *Responsible for handling user interactions.
  *Determines the next state of the game based on info from the user.
2. PrimaryDisplay
  *Controls the what is displayed in the primary display.
  *Provides simple interfaces so that an instance of BattleshipGame can communicate with it.
     (attackAtCell(x, y), areAllShipsDestroyed())
2. TrackingDisplay
  *Controls the what is displayed in the tracking display.
  *Provides simple interfaces so that an instance of BattleshipGame can communicate with it.
     (attackAtCell(x, y), areAllShipsDestroyed())

## Randomly Placing Ships
The approach used here to randomly place ships is pretty much brute force, except that ships are placed one at a time, rather than repeatedly regenerating the positions of each ship until they all fit (which would be astronomically less performant than even this approach).

### Steps
1. Choose a random orientation, and a random position for each of the types of ships.
2. Iterate through the list of ships, until you no longer find any collisions.
3. When a collision is found, nudge that ship in a random direction and check it's new position.
4. Repeat the previous step until no more collisions are found.

At the end of these steps, you should have a grid with ship pieces placed randomly throughout, with no overlap.

## Detecting Collisions Between Ships
Before going over how to determine if two ships are colliding, here are the definitions of any words I'll be using in the explaination.
The "width" of a ship will refer to the number of grid cells the ship takes up in a horizontal direction, taking its orientation into account.
The "height" of a ship is similar to the "width", except that it applies to its vertical direction.
The "bounds" of a ship collision refers to the smallest rectangle that includes the ships involved in the collision, which only applies to two ships at a time in this case.

Keep a game grid in mind, pick any 2 battleship pieces that could show up on the board, and place those pieces in such a way that they are colliding. Observe the "bounds" of the collision at this point, then move the pieces into another collision without rotating each piece, paying attention to the "bounds" of the collision after moving the pieces as well. You should find that the bounds of the collision at both points have exactly the same dimensions. We'll refer to these bounds as the "mimimum bounds" for a set of ships. These dimensions also happen to be the width of the "widest" ship and the height of the "highest" ship.
You should also find that there is no way to arrange the pieces such that the collision bounds are equal to the "mimimum bounds" without them colliding. This is what we can use to quickly detect collisions between ships.
Some simple arithmatic and conditional statements can be used to determine the current bounds for a given pair of ships, and the minimum bounds can be determined even more quickly.

In summary, if the current bounds of any two ships are equal to the minimum bounds of those same two ships then they must be colliding.
NOTE: This approach does not account for ships with the same orientation that happen to be residing in the same row or column. However, those can be caught by comparing the area of the current bounds with the total area of the ship pieces. The only case in which the total area would be less than the expected ship area is if the ships are colliding.