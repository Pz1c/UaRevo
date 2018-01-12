var quest;

function time() {
  return Math.floor(Date.now() / 1000);
}


// initial -> Drink -> afterDrink -> Barn -> beforeRoom -> Room -> End

var GameQuest = function GameQuest() {
  quest = this;
}

GameQuest.prototype.setDictionary = function (dictionary) {
  quest.dict = dictionary;
  
  return true;
}

GameQuest.prototype.stageLose = function (user, command) {
  user.stage_id = 1;
  
  return true;
}

GameQuest.prototype.stageWin = function (user, command) {
  user.stage_id = 1;
  
  return true;
}

GameQuest.prototype.infoLose = function (user) {
  var btn = [[{text:quest.dict.getStringByCode('quest1_lose_btn1', user.lang_code),callback_data:'/restart'}]];
  return {text:quest.dict.getStringByCode('quest1_lose' + user.lose_id, user.lang_code),buttons:btn};
}

GameQuest.prototype.infoWin = function (user) {
  var btn = [[{text:quest.dict.getStringByCode('quest1_win_btn1', user.lang_code),callback_data:'/restart'}]];
  return {text:quest.dict.getStringByCode('quest1_win', user.lang_code),buttons:btn};
}

GameQuest.prototype.userDrink = function (user) {
  user.alcohol -= 1;
  user.alcohol_level += 1;
  user.messages.push(quest.dict.getStringByCode('quest1_user_drink', user.lang_code));
  if (user.alcohol_level > 3) {
    user.messages.push(quest.dict.getStringByCode('quest1_user_drink_alert', user.lang_code).replace('[name]', user.name));
  }
}

GameQuest.prototype.userSmoke = function (user) {
  user.cigarette -= 1;
  user.messages.push(quest.dict.getStringByCode('quest1_user_smoke', user.lang_code));
}

GameQuest.prototype.userJerk = function (user) {
  user.jerk += 1;
  user.messages.push(quest.dict.getStringByCode('quest1_user_jerk', user.lang_code));
}

GameQuest.prototype.stageInitial = function (user, command) {
  user.cigarette = 20;
  user.alcohol = 10;
  user.alcohol_level = 1;
  user.stage_id = 2;
  user.jerk = 0;
  user.room = 0;
  return true;
}

GameQuest.prototype.infoInitial = function (user) {
  if (!user.alcohol_level) {
    quest.stageInitial(user, '');
  }
  
  return {text:quest.dict.getStringByCode('quest1_initial', user.lang_code),buttons:[[{text:quest.dict.getStringByCode('quest1_initial_btn1', user.lang_code),callback_data:'/drink'}]]};
}



GameQuest.prototype.stageDrink = function (user, command) {
  if (command.indexOf('drink') != -1) {
    quest.userDrink(user);
    user.stage_id = 3;
  }
  
  return true;
}

GameQuest.prototype.infoDrink = function (user) {
  var btn = [];
  btn.push([{text:quest.dict.getStringByCode('quest1_drink_btn1', user.lang_code),callback_data:'/fuck_old'}]);
  if (user.cigarette > 0) {
    btn.push([{text:quest.dict.getStringByCode('quest1_drink_btn2', user.lang_code),callback_data:'/smoke'}]);
  }
  btn.push([{text:quest.dict.getStringByCode('quest1_drink_btn3', user.lang_code),callback_data:'/hit'}]);
  btn.push([{text:quest.dict.getStringByCode('quest1_drink_btn4', user.lang_code),callback_data:'/jerk'}]);
  btn.push([{text:quest.dict.getStringByCode('quest1_drink_btn5', user.lang_code),callback_data:'/steal'}]);
  if (user.alcohol > 0) {
    btn.push([{text:quest.dict.getStringByCode('quest1_drink_btn6', user.lang_code),callback_data:'/drink'}]);
  }
  
  return {text:quest.dict.getStringByCode('quest1_drink1', user.lang_code),buttons:btn};
}

GameQuest.prototype.stageAfterDrink = function (user, command) {
  if (command.indexOf('drink') != -1) {
    quest.userDrink(user);
  } else if (command.indexOf('fuck_old') != -1) {
    user.stage_id = 4;
    user.awakened = true;
    user.messages.push(quest.dict.getStringByCode('quest1_user_fuck_old', user.lang_code));
  } else if (command.indexOf('smoke') != -1) {
    quest.userSmoke(user);
  } else if (command.indexOf('hit') != -1) {
    user.stage_id = 4;
    user.awakened = true;
    user.messages.push(quest.dict.getStringByCode('quest1_user_hit', user.lang_code));
  } else if (command.indexOf('jerk') != -1) {
    quest.userJerk(user);
  } else if (command.indexOf('steal') != -1) {
    user.awakened = true;
    user.messages.push(quest.dict.getStringByCode('quest1_user_steal', user.lang_code));
  }
  
  return true;
}

GameQuest.prototype.infoAfterDrink = function (user) {
  var btn = [];
  btn.push([{text:quest.dict.getStringByCode('quest1_drink_btn1', user.lang_code),callback_data:'/fuck_old'}]);
  if (user.cigarette > 0) {
    btn.push([{text:quest.dict.getStringByCode('quest1_drink_btn2', user.lang_code),callback_data:'/smoke'}]);
  }
  btn.push([{text:quest.dict.getStringByCode('quest1_drink_btn3', user.lang_code),callback_data:'/hit'}]);
  btn.push([{text:quest.dict.getStringByCode('quest1_drink_btn4', user.lang_code),callback_data:'/jerk'}]);
  btn.push([{text:quest.dict.getStringByCode('quest1_drink_btn5', user.lang_code),callback_data:'/steal'}]);
  if (user.alcohol > 0) {
    btn.push([{text:quest.dict.getStringByCode('quest1_drink_btn6', user.lang_code),callback_data:'/drink'}]);
  }
  
  return {text:quest.dict.getStringByCode(user.awakened ? 'quest1_drink2' : 'quest1_drink1', user.lang_code),buttons:btn};
}

GameQuest.prototype.stageBarn = function (user, command) {
  if (command.indexOf('drink') != -1) {
    quest.userDrink(user);
  } else if (command.indexOf('smoke') != -1) {
    quest.userSmoke(user);
  } else if (command.indexOf('jerk') != -1) {
    quest.userJerk(user);
  } else if (command.indexOf('goto_wnd') != -1) {
    user.stage_id = 5;
    user.messages.push(quest.dict.getStringByCode('quest1_user_go_to_window', user.lang_code));
  }
  
  return true;
}

GameQuest.prototype.infoBarn = function (user) {
  var btn = [];
  if (user.cigarette > 0) {
    btn.push([{text:quest.dict.getStringByCode('quest1_drink_btn2', user.lang_code),callback_data:'/smoke'}]);
  }
  btn.push([{text:quest.dict.getStringByCode('quest1_drink_btn4', user.lang_code),callback_data:'/jerk'}]);
  btn.push([{text:quest.dict.getStringByCode('quest1_drink_btn5', user.lang_code),callback_data:'/steal'}]);
  btn.push([{text:quest.dict.getStringByCode('quest1_barn_btn1', user.lang_code),callback_data:'/goto_wnd'}]);
  
  return {text:quest.dict.getStringByCode('quest1_barn', user.lang_code),buttons:btn};
}

GameQuest.prototype.stageWindow = function (user, command) {
  if (command.indexOf('propose_drink') != -1) {
    user.alcohol -= 1;
    user.stage_id = -1;
    user.lose_id = 4;
    user.messages.push(quest.dict.getStringByCode('quest1_user_propose_drink_res', user.lang_code));
  } else if (command.indexOf('propose_smoke') != -1) {
    user.cigarette -= 1;
    user.stage_id = 6;
    user.messages.push(quest.dict.getStringByCode('quest1_user_propose_smoke_res', user.lang_code));
    //quest.userSmoke(user);
  } else if (command.indexOf('hide') != -1) {
    user.stage_id = -1;
    user.lose_id = 4;
    user.messages.push(quest.dict.getStringByCode('quest1_user_propose_hide_res', user.lang_code));
  }
  
  return true;
}

GameQuest.prototype.infoWindow = function (user) {
  var btn = [];
  if (user.cigarette > 0) {
    btn.push([{text:quest.dict.getStringByCode('quest1_window_btn1', user.lang_code),callback_data:'/propose_smoke'}]);
  }
  if (user.alcohol > 0) {
    btn.push([{text:quest.dict.getStringByCode('quest1_window_btn2', user.lang_code),callback_data:'/propose_drink'}]);
  }
  btn.push([{text:quest.dict.getStringByCode('quest1_window_btn3', user.lang_code),callback_data:'/hide'}]);
  
  return {text:quest.dict.getStringByCode('quest1_window', user.lang_code),buttons:btn};
}

GameQuest.prototype.stageRoom = function (user, command) {
  user.room += 1;
  if (command.indexOf('touch') != -1) {
    user.messages.push(quest.dict.getStringByCode('quest1_user_touch_res', user.lang_code));
  } else if (command.indexOf('fart') != -1) {
    user.stage_id = -1;
    user.lose_id = 4;
    user.messages.push(quest.dict.getStringByCode('quest1_user_fart_res', user.lang_code));
  } else if (command.indexOf('flirt') != -1) {
    user.messages.push(quest.dict.getStringByCode('quest1_user_flirt_res', user.lang_code));
  } else if (command.indexOf('show') != -1) {
    user.stage_id = 7;
    user.messages.push(quest.dict.getStringByCode('quest1_user_show_res', user.lang_code));
  }
  
  return true;
}

GameQuest.prototype.infoRoom = function (user) {
  var btn = [];
  btn.push([{text:quest.dict.getStringByCode('quest1_room_btn1', user.lang_code),callback_data:'/touch'}]);
  btn.push([{text:quest.dict.getStringByCode('quest1_room_btn2', user.lang_code),callback_data:'/fart'}]);
  btn.push([{text:quest.dict.getStringByCode('quest1_room_btn3', user.lang_code),callback_data:'/flirt'}]);
  btn.push([{text:quest.dict.getStringByCode('quest1_room_btn4', user.lang_code),callback_data:'/show'}]);
  
  return {text:quest.dict.getStringByCode(user.room > 1 ? 'quest1_room1' : 'quest1_room', user.lang_code),buttons:btn};
}

GameQuest.prototype.stageRoom2 = function (user, command) {
  if (command.indexOf('kick') != -1) {
    user.stage_id = -1;
    user.lose_id = 4;
    user.messages.push(quest.dict.getStringByCode('quest1_user_kick_res', user.lang_code));
  } else if (command.indexOf('avoid') != -1) {
    user.stage_id = 8;
    user.messages.push(quest.dict.getStringByCode('quest1_user_avoid_res', user.lang_code));
  }
  
  return true;
}

GameQuest.prototype.infoRoom2 = function (user) {
  var btn = [];
  btn.push([{text:quest.dict.getStringByCode('quest1_room2_btn1', user.lang_code),callback_data:'/kick'}]);
  btn.push([{text:quest.dict.getStringByCode('quest1_room2_btn2', user.lang_code),callback_data:'/avoid'}]);
  
  return {text:quest.dict.getStringByCode('quest1_room2', user.lang_code),buttons:btn};
}

GameQuest.prototype.stageRoom3 = function (user, command) {
  user.stage_id = 0;
  if (command.indexOf('old') != -1) {
    user.messages.push(quest.dict.getStringByCode('quest1_user_old_res', user.lang_code));
  } else if (command.indexOf('bride') != -1) {
    user.messages.push(quest.dict.getStringByCode('quest1_user_bride_res', user.lang_code));
  }
  
  return true;
}

GameQuest.prototype.infoRoom3 = function (user) {
  var btn = [];
  btn.push([{text:quest.dict.getStringByCode('quest1_room3_btn1', user.lang_code),callback_data:'/old'}]);
  btn.push([{text:quest.dict.getStringByCode('quest1_room3_btn2', user.lang_code),callback_data:'/bride'}]);
  
  return {text:quest.dict.getStringByCode('quest1_room3', user.lang_code),buttons:btn};
}


GameQuest.prototype.command = function (user, command) {
  var res = false, stage_before = user.stage_id;
  user.messages = [];
  user.btn = [];
  console.log('quest1.command before', command, stage_before);
  
  switch(user.stage_id) {
    case -1: 
      res = quest.stageLose(user, command);
      break;
    case 0: 
      res = quest.stageWin(user, command);
      break;
    case 1: 
      res = quest.stageInitial(user, command);
      break;
    case 2: 
      res = quest.stageDrink(user, command);
      break;
    case 3: 
      res = quest.stageAfterDrink(user, command);
      break;
    case 4: 
      res = quest.stageBarn(user, command);
      break;
    case 5: 
      res = quest.stageWindow(user, command);
      break;
    case 6: 
      res = quest.stageRoom(user, command);
      break;
    case 7: 
      res = quest.stageRoom2(user, command);
      break;
    case 8: 
      res = quest.stageRoom3(user, command);
      break;
  }
  if (user.cigarette <= 0) {
    user.stage_id = -1;
    user.lose_id = 1;
  }
  if (user.cigarette <= 0) {
    user.stage_id = -1;
    user.lose_id = 2;
  }
  if (user.jerk >= 42) {
    user.stage_id = -1;
    user.lose_id = 3;
  }
  user.stage_changed = stage_before != user.stage_id;
  
  console.log('quest1.command after', user.stage_id, user.stage_changed);
  return res;
}

GameQuest.prototype.getInfo = function (user) {
  var res, txt = '';
  if (user.messages.length > 0) {
    for(var i = 0,Ln = user.messages.length; i < Ln; ++i) {
      txt += user.messages[i] + '\n';
    }
  }
  switch(user.stage_id) {
    case -1: 
      res = quest.infoLose(user);
      break;
    case 0: 
      res = quest.infoWin(user);
      break;
    case 1: 
      res = quest.infoInitial(user);
      break;
    case 2: 
      res = quest.infoInitial(user);
      break;
    case 3: 
      res = quest.infoDrink(user);
      break;
    case 4: 
      res = quest.infoBarn(user);
      break;
    case 5: 
      res = quest.infoWindow(user);
      break;
    case 6: 
      res = quest.infoRoom(user);
      break;
    case 7: 
      res = quest.infoRoom2(user);
      break;
    case 8: 
      res = quest.infoRoom3(user);
      break;
  }
  if (!txt) {
    txt = res.text;
  } else if (user.stage_changed) {
    txt += res.text;
  }
  
  var r = {text:txt, buttons:res.buttons};
  console.log('getInfo', r);
  return r;
}


module.exports.GameQuest = GameQuest;
