var mysql = require('mysql');
var TelegramBot = require('node-telegram-bot-api');

var Game;
var GameParameters;
var admin_user_id = 225066722;
var bot;

var dictionary = require('./dictionary.js');
var dict = new dictionary.UaRevoGameDictionary('ua');
var quest_module1 = require('./quest1.js');
var quest1 = new quest_module1.GameQuest();
quest1.setDictionary(dict);

var quests= [{}, quest1];

var users = [];

var default_user = {lang_code:'ua',quest_id:1,stage_id:1};

// status_id = 1 - set lang
// status_id = 2 - set name

function getUserCode(user_id) {
  return 'u' + user_id;
}

function setDefaultUser(obj) {
  for (key in default_user) {
    obj[key] = default_user[key];
  }
}

function getLangById(user_id) {
  return (users[getUserCode(user_id)] && users[getUserCode(user_id)].lang_code) ? users[getUserCode(user_id)].lang_code : '';
}

function time() {
  return Math.floor(Date.now() / 1000);
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

function fixQuestId(user) {
  if ((user.quest_id < 1) || (user.quest_id > quests.length)) {
    bot.sendMessage(user.user_id, dict.getStringByCode('wrong_quest_id', getLangById(user.user_id)), {parse_mode:"HTML","reply_markup":{"hide_keyboard":true}});
    user.quest_id = 1;
    user.stage_id = 1;
    Game.saveInDB(user);
  }
}
function getQuestByUserID(user_id) {
  return quests[users[getUserCode(user_id)].quest_id];
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
    Game.command(msg.from.id, msg.data);
  }
  this.command = function (msg,command_text) {
    var lower,user_id;
    if (typeof msg === 'number') {
      user_id = msg;
      lower = command_text.toLowerCase().replace('_', ' ');
    } else {
      user_id = msg.from.id;
      lower = msg.text.toLowerCase().replace('_', ' ');
    }
    console.log('UaRevoGame.command', user_id, lower, users.length, users[getUserCode(user_id)] ? users[getUserCode(user_id)].status_id : 'no user');
    var lang_code = getLangById(user_id);
    var find = false;
    if (!users[getUserCode(user_id)] && (lower.indexOf('/start') != 0)) {
      console.log('user not found in users and command not start', user_id, users.length, lower);
      Game.startCommand(user_id, msg.text);
      return;
    } else if (users[getUserCode(user_id)]) {
      console.log('command', users[getUserCode(user_id)].status_id, users[getUserCode(user_id)].name, users[getUserCode(user_id)].quest_id, users[getUserCode(user_id)].stage_id);
      users[getUserCode(user_id)].last_action = time();
    }
    
    for (var key in Game.commands) {
      if (lower.indexOf(key) == 0) {
        return (Game.commands[key])(msg, command_text);
      }
    }
    
    fixQuestId(users[getUserCode(user_id)]);
    
    if (users[getUserCode(user_id)] && users[getUserCode(user_id)].status_id && (users[getUserCode(user_id)].status_id === 2)) {
      Game.setName(user_id, msg.text);
    } else {
      getQuestByUserID(user_id).command(users[getUserCode(user_id)], lower);
      Game.printGrandpaInfo(user_id);
      Game.saveInDB(users[getUserCode(user_id)]);
    }    
  }

  // MySQL
  this.db = mysql.createConnection(GameParameters.db_params);
  this.dbConnected = function (err) {
    if (err) {
      console.log(err.code, err.message, err.stack);
      delyedExit();
      return;
    };
    console.log("MYSQL Connected!");    

    bot.startPolling();
    console.log("bot.startPolling");
  }
}

UaRevoGame.prototype.startCommand = function (msg,command_str) {
  var local_user_id, local_user_info;
  console.log('startCommand', msg, command_str, typeof msg);
  if (typeof msg === 'number') {
    local_user_id = msg;
    console.log('START', 'id', local_user_id, command_str);
    local_user_info = '';
  } else {
    local_user_id = msg.from.id;
    console.log('START', 'msg', local_user_id, command_str);
    local_user_info = (msg.from.first_name + ' ' + msg.from.last_name + ', ' + msg.from.username + ', ' + msg.from.language_code).substring(0, 240);
  }
  if (users[getUserCode(local_user_id)]) {
    //if (users['u'+local_user_id].lang_code === '') {
    //  users['u'+local_user_id].status_id = 1;
    //  bot.sendMessage(local_user_id, dict.getStringByCode('choose_lang', getLangById(local_user_id)), {parse_mode:"HTML","reply_markup":{"inline_keyboard":dict.getLangKeyboard()}});
    //} else 
    if ((users[getUserCode(local_user_id)].name == '') || (users[getUserCode(local_user_id)].name == local_user_id)) {
      users[getUserCode(local_user_id)].status_id = 2;
      bot.sendMessage(local_user_id, dict.getStringByCode('set_name', getLangById(local_user_id)), {parse_mode:"HTML","reply_markup":{"hide_keyboard":true}});
    } else if (command_str) {
      Game.command(local_user_id, command_str);
    } else {
      users[getUserCode(local_user_id)].status_id = 0;
      
      fixQuestId(users[getUserCode(local_user_id)]);
      users[getUserCode(local_user_id)].messages = [];
      users[getUserCode(local_user_id)].btn = [];
      Game.printGrandpaInfo(local_user_id);
    }
  } else {
    Game.db.query('select * from quest_user where user_id = ?', [local_user_id], function (err, result) {
      if (err) {
        bot.sendMessage(admin_user_id, 'select quest_user[' + local_user_id + '] error: ' + err.message, {parse_mode:"HTML","reply_markup":{"hide_keyboard":true}});
        bot.sendMessage(local_user_id, dict.getStringByCode('db_error', getLangById(local_user_id)), {parse_mode:"HTML","reply_markup":{"hide_keyboard":true}});
        return;
      }
      if (result.length === 0) {
        users[getUserCode(local_user_id)] = {user_id:local_user_id,created:time(),last_action:time(),lang_code:'ua',name:local_user_id};
        setDefaultUser(users[getUserCode(local_user_id)]);
        Game.db.query('insert into quest_user(user_id, created, lang_code, last_action, name, user_info) values(?, ?, ?, ?, ?, ?)', [users[getUserCode(local_user_id)].user_id, 
           users[getUserCode(local_user_id)].created, users[getUserCode(local_user_id)].lang_code, users[getUserCode(local_user_id)].last_action, users[getUserCode(local_user_id)].name, local_user_info], function (err, result) {
          if (err) {
            delete users[getUserCode(local_user_id)];            
            bot.sendMessage(admin_user_id, 'insert quest_user[' + local_user_id + '] error: ' + err.message, {parse_mode:"HTML","reply_markup":{"hide_keyboard":true}});
            bot.sendMessage(local_user_id, dict.getStringByCode('db_error', getLangById(local_user_id)), {parse_mode:"HTML","reply_markup":{"hide_keyboard":true}});
            return;
          }
          users[getUserCode(local_user_id)].status_id = 2;
          users[getUserCode(local_user_id)].last_action = time();
        });
      } else {
        users[getUserCode(local_user_id)] = result[0];
        users[getUserCode(local_user_id)].last_action = time();
        if (users[getUserCode(local_user_id)].name === null) {
          users[getUserCode(local_user_id)].name = '';
        }
        users[getUserCode(local_user_id)].status_id = users[getUserCode(local_user_id)].name == users[getUserCode(local_user_id)].user_id ? 2 : 0;
        users[getUserCode(local_user_id)].is_bot = false;
        users[getUserCode(local_user_id)].messages=[];
      }
      console.log('user found in DB',command_str, result[0]);
      Game.startCommand(local_user_id,command_str);
    });
  }
}

UaRevoGame.prototype.saveInDB = function (user) {
  sql = 'update quest_user set quest_id = ?, stage_id = ? '+
        'where user_id = ?';
  
  var arr_values = [user.quest_id, user.stage_id, user.user_id];
  Game.db.query(sql, arr_values, function (err, result) {
    if (err) {
      console.log(sql, err.code, err.message, admin_user_id, arr_values);
      bot.sendMessage(admin_user_id, sql + ' error: ' + err.message + '\n' + JSON.stringify(user), {parse_mode:"HTML","reply_markup":{"hide_keyboard":true}});
      return;
    }
  });
}

function getGrandpaNameFromCommand(arr) {
  arr[0] = '';
  return arr.join(' ').trim();
}

UaRevoGame.prototype.setNameCommand = function (msg, command) {
  var user_id = getUserIDFromMsg(msg);
  var lang_code = getLangById(user_id);
  var command_arr = getCommandArr(msg, command, true);
  name = getGrandpaNameFromCommand(command_arr);
  
  Game.setName(user_id, name);
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
  if (!store_case) {
    lower = lower.toLowerCase();
  }
  return lower.replace('/', '').replace('_', ' ').trim().split(' ');
}

UaRevoGame.prototype.start = function () {
  console.log('UaRevoGame.start');
  bot.on('message', this.command);
  bot.on('callback_query', this.commandCallbackQuery);
  
  this.db.connect(this.dbConnected);

  // START COMMAND

  this.commands['/start'] = this.startCommand;

  //this.settlement();
}

UaRevoGame.prototype.setName = function (user_id, name) {
  console.log('UaRevoGame.setName', user_id, name);
  users[getUserCode(user_id)].name = name.substring(0, 30);
  Game.db.query('update quest_user set name = ?, last_action = ? where user_id = ?', [name, time(), user_id], function (err, result) {
    if (err) {
      if (err.message.indexOf('uidx_quest_user_name') != -1) {
        bot.sendMessage(user_id, dict.getStringByCode('name_no_unique', getLangById(user_id)), {parse_mode:"HTML","reply_markup":{"hide_keyboard":true}});
      } else {
        bot.sendMessage(admin_user_id, 'update name [' + user_id + '] error: ' + err.message, {parse_mode:"HTML","reply_markup":{"hide_keyboard":true}});
        bot.sendMessage(user_id, dict.getStringByCode('db_error', getLangById(user_id)), {parse_mode:"HTML","reply_markup":{"hide_keyboard":true}});
      }
      return;
    }
    users[getUserCode(user_id)].last_action = time();
    bot.sendMessage(user_id, dict.getStringByCode('setname_result', getLangById(user_id)).replace('[name]', name), {parse_mode:"HTML","reply_markup":{"hide_keyboard":true}});
    if (users[getUserCode(user_id)].status_id && (users[getUserCode(user_id)].status_id === 2)) {
      users[getUserCode(user_id)].status_id = 0;
      setTimeout(function() {
        console.log('run Game.startCommand', user_id);
        Game.startCommand(user_id);
      }, 500);
    }
  });
}


UaRevoGame.prototype.printGrandpaInfo = function (user_id) {
  var lang_code = getLangById(user_id);
  // users[getUserCode(user_id)].status_id = 0;
  var qa = getQuestByUserID(user_id).getInfo(users[getUserCode(user_id)]);
  var info = qa.text;
  if (user_id === admin_user_id) {
    info += '\n' + users[getUserCode(user_id)].name + ': status_id=' + users[getUserCode(user_id)].status_id + ', quest_id=' + users[getUserCode(user_id)].quest_id + ', stage_id=' + users[getUserCode(user_id)].stage_id;
  }
  bot.sendMessage(user_id, info, {parse_mode:"HTML","reply_markup":{"inline_keyboard":qa.buttons}});
}
//*/
module.exports.UaRevoGame = UaRevoGame;