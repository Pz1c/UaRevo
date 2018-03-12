var fs = require('fs');
var mysql = require('mysql');
var TelegramBot = require('node-telegram-bot-api');

var Game;
var GameParameters;
var admin_user_id = 225066722;
var bot_user_id = 528925796;
var bot;

var c_map_length   = 88;
var c_cell_in_row  = 7;
var c_cell_empty   = 0;
var c_cell_blue    = 1; // team1
var c_cell_yellow  = 2; // team2
var c_cell_red     = 3; // team3
var c_cell_black   = 4;
var c_cell_white   = 5;
var c_cell_teleport= 6;
var c_cell_trap    = 7;
var c_cell_move    = 8;
//var arr_cell_pic   = ['⬜️', '🌊', '🔥', '💥', '⚫️', '⚪️', '♻️', '🛑', '✳️'];
var arr_cell_pic   = ['[⬜️]', '[🌊]', '[🔥]', '[💥]', '[⚫️]', '[⚪️]', '[♻️]', '[⚠️]', '[✳️]'];
var arr_team_pic   = ['', '[🐋]', '[🐲]', '[🐯]'];

var c_game_status_zero = 0; //

var dictionary = require('./dictionary.js');
var dict = new dictionary.UaRevoGameDictionary('ua');
//var quest_module1 = require('./quest1.js');
//var quest1 = new quest_module1.GameQuest();
//quest1.setDictionary(dict);
// var quests= [{}, quest1];

var games = {};
var users = {};
var is_game_changed = false;
var team_code = ['none', 'blue', 'yellow', 'red'];

var default_user = {lang_code:'ua'};
var default_game = {lang_code:'ua',status:0,team1:[],team2:[],team3:[],current_team:1,answer_team:1,team1_base:0,team2_base:0,team3_base:0,
                    team1_idx:0,team2_idx:0,team3_idx:0,team1_points:{r1:0,r2:0,r3:0,r4:0,r5:0,r6:0,r7:0,r8:0},
                    team2_points:{r1:0,r2:0,r3:0,r4:0,r5:0,r6:0,r7:0,r8:0},team3_points:{r1:0,r2:0,r3:0,r4:0,r5:0,r6:0,r7:0,r8:0},
                    question:{r8:[0,1,2,3,4,5,6,7,8,9,10,11],r7:[0,1,2,3,4,5,6,7,8,9,10,11],r1:[0,1,2,3,4,5,6,7,8,9,10,11],r2:[0,1,2,3,4,5,6,7,8,9,10,11],
                    r3:[0,1,2,3,4,5,6,7,8,9,10,11],r4:[0,1,2,3,4,5,6,7,8,9,10,11],r5:[0,1,2,3,4,5,6,7,8,9,10,11],r6:[0,1,2,3,4,5,6,7,8,9,10,11]},
                    map:[-1,0,0,0,8,0,5,0,0,0,0,0,4,0,0,0,5,0,0,0,5,7,0,0,0,0,0,0,0,0,0,0,4,0,0,0,0,5,0,0,5,7,0,0,8,0,0,0,6,0,0,0,5,0,0,0,0,0,0,5,0,0,7,0,0,5,0,0,0,0,0,0,0,0,8,0,5,4,0,5,0,0,0,0,8,5,0,0,7,5,0,0,0,5,0,0,0]
                    //map:[]
                    };

var answers = {
  r1: [1, 2, 2, 1, 1, 1, 2, 1, 2, 3, 3, 1],
  r2: [2, 2, 3, 1, 2, 3, 1, 3, 2, 1, 2, 1],
  r3: [3, 3, 2, 1, 2, 1, 3, 2, 2, 2, 1, 1],
  r4: [3, 2, 3, 3, 1, 3, 2, 3, 2, 2, 3, 2],
  r5: [1, 2, 2, 3, 3, 2, 1, 1, 2, 1, 2, 1],
  r6: [3, 1, 2, 1, 1, 1, 1, 3, 1, 1, 2, 3],
  r7: [1, 1, 3, 1, 1, 2, 2, 3, 1, 1, 1, 2],
  r8: [2, 2, 1, 2, 2, 2, 1, 3, 2, 2, 3, 1]
};


function prepareDefaultGame() {
  /*default_game.map[0] = -1;
  for (var i = 1; i <= c_map_length; ++i) {
    if (i % 7 === 0) {
      default_game.map[i] = c_cell_black;
    } else if (i % 15 === 0) {
      default_game.map[i] = c_cell_white;
    } else if (i % 18 === 0) {
      default_game.map[i] = c_cell_teleport;
    } else if (i % 23 === 0) {
      default_game.map[i] = c_cell_trap;
    } else {
      default_game.map[i] = c_cell_empty;
    }
  }//*/
  //default_game.map[]
}

function loadFromFile() {
  fs.readFile('data/data.json', function read(err, data) {
      if (err) {
        // return;
      } else {
        var j = JSON.parse(data);
        games = j.arr_games;
        users = j.arr_users;
        console.log("load games, users");
      }
      
      bot.startPolling();
      console.log("bot.startPolling");
  });
}

function saveToFile() {
  if (!is_game_changed) {
    return;
  }
  is_game_changed = false;
  //var str = JSON.stringify(games);
  //console.log('try to save', str);//, users, games);
  fs.writeFile("data/data.json", JSON.stringify({arr_users:users,arr_games:games}), function(err) {
    if(err) {
      return console.log(err);
    }
    console.log("The file was saved!");
  });
}

function saveGameState() {
  setTimeout(function () { 
      saveToFile();
      saveGameState();
    } , 60000);
}

// status_id = 1 - set lang
// status_id = 2 - set name

function getUserCode(user_id) {
  return 'u' + user_id;
}

function getGameCode(chat_id) {
  return 'g' + chat_id;
}

function isObject(val) {
    return val instanceof Object; 
}

function copyArrayToObj(arr, obj) {
  for (key in arr) {
    if (Array.isArray(arr[key])) {
      obj[key] = arr[key].slice();
    } else if (isObject(arr[key])) {
      obj[key] = {};
      copyArrayToObj(arr[key], obj[key]);
    } else {
      obj[key] = arr[key];
    }
  }
}

function setDefaultUser(obj) {
  copyArrayToObj(default_user, obj);
}

function setDefaultGame(obj) {
  copyArrayToObj(default_game, obj);
}

function shuffleQuestion(game) {
  for (var i = 1; i < 9; ++i) {
    game.question['r'+i] = shuffle(game.question['r'+i]);
  }
}

function getLangById(user_id, type) {
  if (type === 'g') {
    var code = getGameCode(user_id);
    return (games[code] && games[code].lang_code) ? games[code].lang_code : '';
  } else {
    var code = getUserCode(user_id);
    return (users[code] && users[code].lang_code) ? users[code].lang_code : '';
  }
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}

function throwDice() {
  return getRandomInt(1, 7);
}

function time() {
  return Math.floor(Date.now() / 1000);
}

function shuffle(array) {
  var currentIndex = array.length, temporaryValue, randomIndex;

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {

    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
}

function delyedExit(time) {
  if (!time) {
    time = 1000;
  }
  setTimeout(function() {
      console.log('run process.exit(0)');
      process.exit(0);
    }, time);
}

function saveUser(msg) {
  if (!msg.from || !msg.from.id) {
    return ;
  }
  if (users[getUserCode(msg.from.id)]) {
    users[getUserCode(msg.from.id)].last_action = time();
  } else {
    users[getUserCode(msg.from.id)] = {user_id:msg.from.id,created:time(),last_action:time(),lang_code:'ua',name:getNameFromUser(msg.from)};
    setDefaultUser(getUserCode(msg.from.id));
  }
}

function parseMessage(msg, command_text, chat_id) {
  var lower,user_id,original_command;
  if (typeof msg === 'number') {
    return {user_id:msg,lower:command_text.toLowerCase().replace('_', ' '),chat_id:chat_id,command_text:command_text};
  } else {
    user_id = msg.from.id;
    chat_id = msg.chat ? msg.chat.id : 0;
    if (user_id === chat_id) {
      chat_id = 0;
    }
    if (msg.text) {
      lower = msg.text.toLowerCase().replace('_', ' ');
      //lower = lower.substr(0, lower.indexOf('@'));
      //lower = msg.query.toLowerCase().replace('_', ' '); // for inline bot
      original_command = msg.text;//msg.query;//msg.text;
    } else {
      if (msg.new_chat_members && (msg.new_chat_members.length > 0)) {
        var found = false;
        for (var i = 0, Ln = msg.new_chat_members.length; i < Ln; ++i) {
          if (msg.new_chat_members[i].id  === bot_user_id) {
            found = true;
            break;
          }
        }
        if (found) {
          lower = 'bot_added_to_chat';
          original_command = 'bot_added_to_chat';
        } else {
          lower = 'human_added_to_chat';
          original_command = 'human_added_to_chat';
        }
      } else {
        lower = 'unknown_command';
        original_command = 'unknown_command';
      }
      
    }
    saveUser(msg);
    return {user_id:msg.from.id,lower:lower,chat_id:chat_id,command_text:original_command};
  }
}

var UaRevoGame = function UaRevoGame(params) {
  GameParameters = params;

  Game = this;

  // COMANDS
  this.commands = [];

  // TELEGRAM
  bot = new TelegramBot(GameParameters.telegram_api_token, {polling: false});
  bot.GameObject = this;
  this.commandCallbackQuery = function (msg,command_text) {
    // bot.sendMessage(msg.from.id, msg.data, {parse_mode:"HTML","reply_markup":{"hide_keyboard":true}});
    console.log('commandCallbackQuery', msg, command_text);
    Game.command(msg.from.id, msg.data);
  }
  
  this.commandInlineQuery = function (msg,command_text) {
    // bot.sendMessage(msg.from.id, msg.data, {parse_mode:"HTML","reply_markup":{"hide_keyboard":true}});
    console.log('commandInlineQuery', msg, command_text);
    //Game.command(msg.from.id, msg.data);
  }
  
  this.command = function (msg,command_text,chat_id) {
    console.log('command', msg,command_text, chat_id/*, games*/);
    var message = parseMessage(msg,command_text,chat_id)
    console.log('UaRevoGame.command', message.user_id, message.lower, users.length, users[getUserCode(message.user_id)] ? users[getUserCode(message.user_id)].name : 'no user');
    for (var key in Game.commands) {
      if (message.lower.indexOf(key) === 0) {
        return (Game.commands[key])(message.user_id, message.command_text, message.chat_id);
      }
    }
    // command not found
    Game.helpCommand(message.user_id, message.command_text, message.chat_id);
  }
  
  prepareDefaultGame();
  loadFromFile();
  saveGameState();
  
  // MySQL
  /*this.db = mysql.createConnection(GameParameters.db_params);
  this.dbConnected = function (err) {
    if (err) {
      console.log(err.code, err.message, err.stack);
      delyedExit();
      return;
    };
    console.log("MYSQL Connected!");    

    bot.startPolling();
    console.log("bot.startPolling");
  }*/
}

function getNameFromUser(user) {
  if (user.username) {
    return user.username
  }
  if (user.first_name) {
    return (user.first_name + ' ' + user.last_name).trim();
  }  
}

function getTeamList(chat_id) {
  var lang_code = getLangById(chat_id, 'g');
  var str = dict.getStringByCode('team_title', lang_code) + '\n';
  for (var i = 1; i <= 3; ++i) {
    str += dict.getStringByCode('team'+i+'_title', lang_code) + '\n';
    for (var j = 0, Ln = games[getGameCode(chat_id)]['team' + i].length; j < Ln; ++j) {
      var user_code = getUserCode(games[getGameCode(chat_id)]['team' + i][j]);
      if (users[user_code]) {
        str += users[user_code].name + '\n';
      }
    }
  }
  return str;
}

function idxToCodeIdx(idx) {
  var res = String.fromCharCode(65 + Math.floor(idx/c_cell_in_row)) + '' + (idx % c_cell_in_row);
  return res;
}

function codeIdxToIdx(code_idx) {
  var res = (code_idx.charCodeAt(0) - 65) * 1 + code_idx.substr(1, 1) * 1;
  return res;
}

function getTeamStats(game, team_id) {
  if (game['team' + team_id].length === 0) {
    return '';
  }
  var res = dict.getStringByCode('team_title1', getLangById(game.chat_id, 'g')) + ' ' + dict.getStringByCode('team'+team_id+'_title', getLangById(game.chat_id, 'g'));
  var empty = true;
  for (var i = 1; i <= 8; ++i) {
    if (game['team' + team_id + '_points']['r'+i] > 0) {
      empty = false;
      res += '\n' + dict.getStringByCode('region_title_'+i+'_one', getLangById(game.chat_id, 'g')) + ': '+ game['team' + team_id + '_points']['r'+i];
    }
  }
  if (empty) {
    res += dict.getStringByCode('team_no_points', getLangById(game.chat_id, 'g'));
  }
  return res;
}
  
function getGameStats(chat_id) {
  var game = games[getGameCode(chat_id)];
  //var map = '0️⃣ 1️⃣ 2️⃣ 3️⃣ 4️⃣ 5️⃣ 6️⃣ 7️⃣ 8️⃣\n';
  var map = '';//'[0][1][2][3][4][5][6][7][8]\n[A]';
  var i;
  //var row_idx = 1;
  for (i = 0; i <= c_map_length; ++i) {
    //if (i % c_cell_in_row === c_cell_in_row - 1) {
    //  map += '[' + String.fromCharCode(64 + (++row_idx)) + ']';
    //}
    if (i === game.team1_idx) {
      map += arr_team_pic[1];
    } else if (i === game.team2_idx) {
      map += arr_team_pic[2];
    } else if (i === game.team3_idx) {
      map += arr_team_pic[3];
    } else {
      map += arr_cell_pic[game.map[i]];
    }
    if ((i > 0) && ((i + 1) % c_cell_in_row === 0)) {
      map += '\n';
    }
  }
  for (i = 1; i < 4; ++i) {
    map += '\n' + getTeamStats(game, i, true);
  }
  return map;
}

UaRevoGame.prototype.helpCommand = function (local_user_id,command_str,chat_id) {
  if (!chat_id) {
    sendMessage(chat_id, local_user_id, dict.getStringByCode('start_from_single', getLangById(local_user_id)), []);
  } else {
    sendMessage(chat_id, local_user_id, dict.getStringByCode('start_from_chat', getLangById(chat_id, 'g')), []);
  }
}

UaRevoGame.prototype.startGameCommand = function (local_user_id,command_str,chat_id) {
  if (!chat_id) {
    sendMessage(chat_id, local_user_id, dict.getStringByCode('start_from_single', getLangById(local_user_id)), []);
    return;
  }
  is_game_changed = true;  
  //console.log('startGameCommand'/*, games*/);
  
  games[getGameCode(chat_id)] = {chat_id:chat_id,created:time(),last_action:time(),lang_code:'ua'};
  setDefaultGame(games[getGameCode(chat_id)]);
  shuffleQuestion(games[getGameCode(chat_id)])
  console.log('startGameCommand', games[getGameCode(chat_id)]);
  var txt = dict.getStringByCode('start_game', getLangById(local_user_id));
  //txt += '\n' + getTeamList(chat_id);
  txt += '\n' + getGameStats(chat_id);
  txt += '\n' + dict.getStringByCode('team_empty', getLangById(local_user_id));
  sendMessage(chat_id, local_user_id, txt, []);
}

UaRevoGame.prototype.newHumanCommand = function (local_user_id,command_str,chat_id) {
  if (!chat_id) {
    sendMessage(chat_id, local_user_id, dict.getStringByCode('start_from_single', getLangById(local_user_id)), []);
    return;
  }
  is_game_changed = true;  
  console.log('newHumanCommand'/*, games*/);
  var txt = dict.getStringByCode('new_human', getLangById(local_user_id));
  txt += '\n' + getTeamList(chat_id);
  sendMessage(chat_id, local_user_id, txt, []);
}

function getQuestionRegionByTeamAndType(team_stats, team_base, cell_type) {
  if (cell_type === c_cell_black) {
    return 7;
  }
  if (cell_type === c_cell_white) {
    return 8;
  }
  if (team_stats['r' + team_base] < 4) {
    return team_base;
  }
  var arr = [];
  for (var i = 1; i <= 6; ++i) {
    if (i === team_base) {
      continue;
    } else if (team_stats['r' + i] < 4) {
      arr.push(i);
    }
  }
  var idx = getRandomInt(0, arr.length);
  return arr[idx];
}

UaRevoGame.prototype.getQuestion = function (game,cell_type) {
  game.status = 4; // wait answer
  game.question_r = getQuestionRegionByTeamAndType(game['team' + game.answer_team + '_points'], game['team' + game.answer_team + '_base'], cell_type);
  if (game.question_r === 0) {
    game.status = 2;
    return;
  }
  
  game.question_id = game.question['r'+game.question_r].shift();
  game.answer_idx = 0;
  var txt_q_id = game.question_id + 1;
  var txt = '\n' + dict.getStringByCode('question_title', getLangById(game.chat_id, 'g')).replace('[#]', txt_q_id)
                .replace('[question_type]', dict.getStringByCode('region_title_' + game.question_r, getLangById(game.chat_id, 'g')));
  txt += '\n' + dict.getStringByCode('q_' + game.question_r + '_' + txt_q_id, getLangById(game.chat_id, 'g'));
  var l_answ = shuffle([1, 2, 3]);
  for (var i = 0; i < 3; ++i) {
    if (l_answ[i] === answers['r' + game.question_r][game.question_id]) {
      game.answer_idx = i + 1;
    }
    txt += '\n' + (i + 1) + '. ' + dict.getStringByCode('q_' + game.question_r + '_' + txt_q_id + '_a' + l_answ[i], getLangById(game.chat_id, 'g')) + ' /answer_' + (i + 1);
  }
  return txt;
}

function fillRandEmptyCell(game, fill_id) {
  var idx = getRandomInt(1, 89) - 1, circle = 0;
  while(true) {
    if (++idx > c_map_length) {
      if (++circle === 2) {
        break;
      }
      idx = 1;
    }
    if (game.map[idx] === c_cell_empty) {
      game.map[idx] = fill_id;
      break;
    }
  }
}

function checkAnswer(game, answer_idx, local_user_id) {
  var res = '';
  var finish_turn = true;
  if (game.answer_idx === answer_idx) {
    ++game['team' + game.answer_team + '_points']['r' + game.question_r];
    switch(game.cell_type) {
      case c_cell_black:
        //++game['team' + game.answer_team].r7; // black;
        res = dict.getStringByCode('answer_right_black', getLangById(game.chat_id, 'g'));
        break;
      case c_cell_white:
        //++game['team' + game.answer_team].r8; // white;
        res = dict.getStringByCode('answer_right_white', getLangById(game.chat_id, 'g'));
        fillRandEmptyCell(game, game.current_team);
        break;
      case c_cell_empty:
      case c_cell_blue:
      case c_cell_yellow:
      case c_cell_red:
        if (game.cell_type === c_cell_empty) {
          game.map[game['team' + game.current_team + '_idx']] = game.current_team;
        }
        res = dict.getStringByCode('answer_right', getLangById(game.chat_id, 'g'));
        break;
      case c_cell_teleport:
        res = dict.getStringByCode('answer_right_teleport', getLangById(game.chat_id, 'g'));
        res += '\n' + Game.getQuestion(game, game.current_team);
        finish_turn = false;
        break;
    }
    
  } else {
    game.question['r'+game.question_r].push(game.question_id);
    game.question_id = 0;
    game.question_r = 0;
    game.cell_type = 0;
    res = dict.getStringByCode('answer_wrong', getLangById(game.chat_id, 'g'));
  }
  if (finish_turn) {
    res += '\n' + Game.finishTurn(local_user_id, game);
  }
  
  return res;
}

function getNextTeam(game) {
  var curr_idx = game.current_team + 1;
  //console.log('get NextTeam', curr_idx, game);
  while (true) {
    if (curr_idx > 3) {
      curr_idx = 1;
    }
    if (game['team' + curr_idx].length > 0) {
      //console.log('get NextTeam', 'return', curr_idx, game['team' + curr_idx].length, game['team' + curr_idx]);
      return curr_idx;
    } else {
      ++curr_idx;
    }
  }
}

function checkWinner(game) {
  for (var i = 1; i <= 3; ++i) {
    var cnt = 0;
    for(var j = 1; j <= 6; ++j) {
      if (game['team' + i + '_points']['r' + j] >= 4) {
        ++cnt;
      }
    }
    if (cnt >= 6) {
      game.status = 6;
      return dict.getStringByCode('win_team' + i, getLangById(game.chat_id, 'g'));
    }
  }
  return '';
}

UaRevoGame.prototype.finishTurn = function (local_user_id,game) {
  var next_team = getNextTeam(game);
  var txt = dict.getStringByCode('finish_turn', getLangById(local_user_id)).replace('[team_title]', dict.getStringByCode('team'+next_team+'_title', getLangById(game.chat_id, 'g')));
  game.current_team = next_team;
  game.answer_team = next_team;
  game.status = 2;
  txt += '\n' + getGameStats(game.chat_id);
  txt += '\n' + checkWinner(game);
  return txt;
}

UaRevoGame.prototype.turnAction = function (local_user_id,game,cell_type) {
  if (cell_type === c_cell_move) {
    game.status = 2; // wait for dice
    return dict.getStringByCode('dice_action_' + cell_type, getLangById(game.chat_id, 'g'));
  }
  
  var res = '';
  if (cell_type === c_cell_trap) {
    console.log('TRAP', game.current_team, game['team' + game.current_team + '_points']);
    if (game['team' + game.current_team + '_points'].r7 > 0) {
      --game['team' + game.current_team + '_points'].r7;
      cell_type = game.current_team;
      game.cell_type = game.current_team;
      res += dict.getStringByCode('trap_deactivated', getLangById(game.chat_id, 'g')) + '\n';
    } else {
      return dict.getStringByCode('dice_action_' + cell_type, getLangById(game.chat_id, 'g')) + 
             '\n' + Game.finishTurn(local_user_id,game,cell_type);
    }
  }
  
  if ((game.current_team != cell_type) && ((cell_type === c_cell_blue) || (cell_type === c_cell_yellow) || (cell_type === c_cell_red))) {
    // change current_team 
    res += dict.getStringByCode('enemy_cell', getLangById(game.chat_id, 'g')).replace('[team_title]', dict.getStringByCode('team'+cell_type+'_title', getLangById(game.chat_id, 'g')));
    game.answer_team = cell_type;
  } else {
    game.answer_team = game.current_team;
    res += dict.getStringByCode('dice_action_' + cell_type, getLangById(game.chat_id, 'g'));
  }
  // base question
  res += '\n' + Game.getQuestion(game,cell_type);
  
  return res;
}

UaRevoGame.prototype.turnCommand = function (local_user_id,command_str,chat_id) {
  if (!chat_id) {
    sendMessage(chat_id, local_user_id, dict.getStringByCode('start_from_single', getLangById(local_user_id)), []);
    return;
  }
  
  if (!games[getGameCode(chat_id)]) {
    Game.startGameCommand(local_user_id,command_str,chat_id);
    return;
  }
  
  if (games[getGameCode(chat_id)].status === 6) {
    sendMessage(chat_id, local_user_id, dict.getStringByCode('game_finished', getLangById(local_user_id)), []);
    return;
  }
  
  if ((games[getGameCode(chat_id)]['team' + games[getGameCode(chat_id)].current_team]).indexOf(local_user_id) === -1) {
    sendMessage(chat_id, local_user_id, dict.getStringByCode('wrong_team', getLangById(local_user_id)), []);
    return;
  }
  
  if (games[getGameCode(chat_id)].status > 2) {
    sendMessage(chat_id, local_user_id, dict.getStringByCode('dice_thrown', getLangById(local_user_id)), []);
    return;
  }
  
  games[getGameCode(chat_id)].status = 3;
  var curr_idx = games[getGameCode(chat_id)].current_team;
  if ((games[getGameCode(chat_id)]['team' + curr_idx]).indexOf(local_user_id) === -1) {
    sendMessage(chat_id, local_user_id, dict.getStringByCode('wrong_team', getLangById(local_user_id)), []);
    return;
  }
  is_game_changed = true;
  var dice = throwDice();
  games[getGameCode(chat_id)]['team' + curr_idx + '_idx'] += dice;
  while(games[getGameCode(chat_id)]['team' + curr_idx + '_idx'] > c_map_length) {
    games[getGameCode(chat_id)]['team' + curr_idx + '_idx'] -= c_map_length;
  }
  var idx = games[getGameCode(chat_id)]['team' + curr_idx + '_idx'];
  var idx_code = idxToCodeIdx(idx);
  var cell_type = games[getGameCode(chat_id)].map[games[getGameCode(chat_id)]['team' + curr_idx + '_idx']];
  games[getGameCode(chat_id)].cell_type = cell_type;
  var txt = dict.getStringByCode('dice_result', getLangById(local_user_id)).replace('[dice]', dice).replace('[cell_type]', dict.getStringByCode('dice_type_' + cell_type, getLangById(local_user_id)));
  txt += '\n' + getGameStats(chat_id);
  txt += '\n' + Game.turnAction(local_user_id, games[getGameCode(chat_id)], cell_type);
  sendMessage(chat_id, local_user_id, txt, []);
}

UaRevoGame.prototype.startCommand = function (local_user_id,command_str,chat_id) {
  if (!chat_id) {
    sendMessage(chat_id, local_user_id, dict.getStringByCode('start_from_single', getLangById(local_user_id)), []);
    return;
  }
  
  //console.log('startCommand'/*, games*/);
  is_game_changed = true;
  if (!games[getGameCode(chat_id)]) {
    Game.startGameCommand(local_user_id,command_str,chat_id);
    return;
  }
  
  if ((games[getGameCode(chat_id)].status > 0) && (games[getGameCode(chat_id)].status < 6)) {
    var txt = dict.getStringByCode('game_started', getLangById(local_user_id));
    sendMessage(chat_id, local_user_id, txt, []);
    return;
  }
  
  var cnt = 0, with_admin = false, first_index = 0;
  var arr_base = shuffle([1,2,3,4,5,6]);
  for (var i = 1; i <= 3; ++i) {
    if (games[getGameCode(chat_id)]['team' + i].length > 0) {
      if (!first_index) {
        first_index = i;
      }
      ++cnt;
      games[getGameCode(chat_id)]['team'+i+'_base'] = arr_base[i];
      
      if (!with_admin) {
        for(var j = 0, Ln = games[getGameCode(chat_id)]['team' + i].length; j < Ln; ++j) {
          if (games[getGameCode(chat_id)]['team' + i][j] === admin_user_id) {
            with_admin = true;
            break;
          }
        }
      }
    }
  }
  if (!with_admin && (cnt < 2)) {
    var txt = dict.getStringByCode('team_empty', getLangById(local_user_id));
    txt += '\n' + getTeamList(chat_id);
    sendMessage(chat_id, local_user_id, txt, []);
    return;
  }
  
  games[getGameCode(chat_id)].status = 1;
  games[getGameCode(chat_id)].current_team = first_index;
  games[getGameCode(chat_id)].answer_team = first_index;
  var txt = dict.getStringByCode('first_step', getLangById(local_user_id));
  txt += '\n' + dict.getStringByCode('team' + first_index + '_title', getLangById(local_user_id));
  txt += '\n' + dict.getStringByCode('step_command', getLangById(local_user_id));
  sendMessage(chat_id, local_user_id, txt, []);  
}

UaRevoGame.prototype.teamCommand = function (local_user_id,command_str,chat_id) {
  if (!chat_id) {
    sendMessage(chat_id, local_user_id, dict.getStringByCode('start_from_single', getLangById(local_user_id)), []);
    return;
  }
  is_game_changed = true;
  if (!games[getGameCode(chat_id)]) {
    Game.startGameCommand(local_user_id,command_str,chat_id);
    //return;
  }
  
  var arr = getCommandArr('', command_str, false); //expect "/team_blue"
  var need_idx = team_code.indexOf(arr[1]);
  console.log('teamCommand', arr, need_idx);
  if ((need_idx < 1) || (need_idx > 3)) {
    sendMessage(chat_id, local_user_id, dict.getStringByCode('team_unknown', getLangById(local_user_id)), []);
    return;
  }
  var curr_user_code = getUserCode(local_user_id);
  var found_i = -1, found_j = -1;
  for (var i = 1; i <= 3; ++i) {
    for (var j = 0, Ln = games[getGameCode(chat_id)]['team' + i].length; j < Ln; ++j) {
      var user_code = getUserCode(games[getGameCode(chat_id)]['team' + i][j]);
      if (user_code === curr_user_code) {
        if (i === need_idx) {
          var txt = users[user_code].name + ' ' + dict.getStringByCode('team_already', getLangById(local_user_id)) + ' ' + dict.getStringByCode('team' + i + '_title');
          sendMessage(chat_id, local_user_id, txt, []);
          return;
        } else {
          found_i = i;
          found_j = j;
          break;
          //games[getGameCode(chat_id)]['team' + i].splice(j, 1);
        }
      }
    }
    //if (i === need_idx) {
    //  games[getGameCode(chat_id)]['team' + i].push(local_user_id);
    //}
  }
  if (found_i != -1) {
    if ((games[getGameCode(chat_id)].status >= 2) && (local_user_id != admin_user_id)) {
      var txt = users[user_code].name + ' ' + dict.getStringByCode('team_late', getLangById(local_user_id));
      sendMessage(chat_id, local_user_id, txt, []);
      return;
    }
    games[getGameCode(chat_id)]['team' + found_i].splice(found_j, 1);
  }
  games[getGameCode(chat_id)]['team' + need_idx].push(local_user_id);
  var txt = users[curr_user_code].name + ' ' + dict.getStringByCode('team_now', getLangById(local_user_id)) + ' ' + dict.getStringByCode('team' + need_idx + '_title');
  sendMessage(chat_id, local_user_id, txt, []);
}

UaRevoGame.prototype.statusCommand = function (local_user_id,command_str,chat_id) {
  if (!chat_id) {
    sendMessage(chat_id, local_user_id, dict.getStringByCode('start_from_single', getLangById(local_user_id)), []);
    return;
  }
  
  if (!games[getGameCode(chat_id)]) {
    Game.startGameCommand(local_user_id,command_str,chat_id);
    //return;
  }  
  
  var txt = getGameStats(chat_id);
  sendMessage(chat_id, local_user_id, txt, []);
}

UaRevoGame.prototype.restartCommand = function (local_user_id,command_str,chat_id) {
  if (!chat_id) {
    sendMessage(chat_id, local_user_id, dict.getStringByCode('start_from_single', getLangById(local_user_id)), []);
    return;
  }
  
  Game.startGameCommand(local_user_id,command_str,chat_id);
  var txt = getGameStats(chat_id);
  sendMessage(chat_id, local_user_id, txt, []);
}

UaRevoGame.prototype.answerCommand = function (local_user_id,command_str,chat_id) {
  if (!chat_id) {
    sendMessage(chat_id, local_user_id, dict.getStringByCode('start_from_single', getLangById(local_user_id)), []);
    return;
  }
  
  if (!games[getGameCode(chat_id)]) {
    Game.startGameCommand(local_user_id,command_str,chat_id);
    return;
  }
  
  if (games[getGameCode(chat_id)].status === 6) {
    sendMessage(chat_id, local_user_id, dict.getStringByCode('game_finished', getLangById(local_user_id)), []);
    return;
  }
  
  if ((games[getGameCode(chat_id)]['team' + games[getGameCode(chat_id)].answer_team]).indexOf(local_user_id) === -1) {
    sendMessage(chat_id, local_user_id, dict.getStringByCode('wrong_team', getLangById(local_user_id)), []);
    return;
  }
  
  if (games[getGameCode(chat_id)].status > 4) {
    sendMessage(chat_id, local_user_id, dict.getStringByCode('answer_given', getLangById(local_user_id)), []);
    return;
  }
  
  if (games[getGameCode(chat_id)].status != 4) {
    sendMessage(chat_id, local_user_id, dict.getStringByCode('answer_wrong_status', getLangById(local_user_id)), []);
    return;
  }
  
  is_game_changed = true;  
  var arr = getCommandArr('', command_str, false); //expect "/answer_1"
  var answer_idx = arr[1] * 1;
  if ((answer_idx < 1) || (answer_idx > 3)) {
    sendMessage(chat_id, local_user_id, dict.getStringByCode('wrong_answer_idx', getLangById(local_user_id)), []);
    return;
  }
    
  games[getGameCode(chat_id)].status = 5
  var txt = checkAnswer(games[getGameCode(chat_id)], answer_idx, local_user_id);
  sendMessage(chat_id, local_user_id, txt, []);
}

function getUserIDFromMsg(msg) {
  if (typeof msg === 'number') {
    return msg;
  } else {
    return msg.from.id;
  }
}

function getCommandArr(msg, command, store_case) {
  //console.log('getCommandArr', msg, command);
  var lower = !command ? msg.text : command;
  if (lower.indexOf('@') != -1) {
    lower = lower.substr(0, lower.indexOf('@'));
  }
  if (!store_case) {
    lower = lower.toLowerCase();
  }
  return lower.replace('/', '').replace('_', ' ').trim().split(' ');
}

function sendMessage(chat_id, user_id, txt, btn) {
  console.log('sendMessage', chat_id, user_id, txt, btn);
  bot.sendMessage(chat_id ? chat_id : user_id, txt, {parse_mode:"HTML","reply_markup":{"hide_keyboard":true}});
}

UaRevoGame.prototype.start = function () {
  console.log('UaRevoGame.start');
  bot.on('message', this.command);
  bot.on('callback_query', this.commandCallbackQuery);
  //bot.on('inline_query', this.command)
  
  //this.db.connect(this.dbConnected);

  // START COMMAND

  this.commands['/start'] = this.startCommand;
  this.commands['/team'] = this.teamCommand;
  this.commands['/status'] = this.statusCommand;
  this.commands['/dice'] = this.turnCommand;
  this.commands['bot_added_to_chat'] = this.startGameCommand;
  this.commands['human_added_to_chat'] = this.newHumanCommand;
  this.commands['/restart'] = this.restartCommand;
  this.commands['/answer'] = this.answerCommand;
  this.commands['/help'] = this.helpCommand;

  //this.settlement();
}

//*/
module.exports.UaRevoGame = UaRevoGame;