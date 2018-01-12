var game = require('./game_modules/index.js');
var p = require('./parameters.js');
var Game = new game.UaRevoGame(p.params);
console.log("all fine");
Game.start();
console.log("start game");

// https://core.telegram.org/bots/api#message
