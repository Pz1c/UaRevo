var default_lang = 'ua'
var dictionary = [];
dictionary['hi'] = {ua:'Привіт'/*,en:'Hello'*/};
dictionary['set_name'] = {ua:'Обери ім\'я, збочинець.'};
dictionary['setname_result'] = {ua:'всі: Привіт, [name]!'};
dictionary['db_error'] = {ua:'Вибачте, помилка доступу до бази. Спробуйте ще раз, пізніше.'};
dictionary['name_no_unique'] = {ua:'Вибачте, це ім\'я уже зайняте, виберіть інше.'};
dictionary['wrong_quest_id'] = {ua:'Невідома розповідь, доведеться почати з самого початку'};


var lang_list = [{code:'ua',title:'Українська 🇺🇦'}/*,{code:'en',title:'English 🇬🇧'}*/];

var UaRevoGameDictionary = function UaRevoGameDictionary(def_lang) {
  if (def_lang) {
    default_lang = def_lang;
  }
}

UaRevoGameDictionary.prototype.getStringByCode = function (code, lang) {
  //console.log('UaRevoGameDictionary.getStringByCode', code, lang);
  if (!lang) {
    lang = default_lang;
  }
  var res;
  var code_obj = dictionary[code];
  if (!code_obj) {
	  res = code + '_' + lang;
  } else {
    res = code_obj[lang];
  }
  return res;
}

UaRevoGameDictionary.prototype.isLangAvailable = function (lang) {
  console.log('UaRevoGameDictionary.isLangAvailable', lang);
  for(var i = 0, Ln = lang_list.length; i< Ln; ++i) {
    if (lang_list[i].code === lang) {
      return true;
    }
  }
  return false;
}

UaRevoGameDictionary.prototype.getLangCode = function (lang) {
  console.log('UaRevoGameDictionary.isLangAvailable', lang);
  for(var i = 0, Ln = lang_list.length; i< Ln; ++i) {
    if ((lang_list[i].code === lang) || (lang_list[i].title === lang)) {
      return lang_list[i].code;
    }
  }
  return '';
}

UaRevoGameDictionary.prototype.getDefaultLang = function () {
  return default_lang;
}

UaRevoGameDictionary.prototype.getLangKeyboard = function () {
  var arr = [];
  for(var i = 0, Ln = lang_list.length; i< Ln; ++i) {
    arr.push([{text:lang_list[i].title,callback_data:'/setlang_'+lang_list[i].code}]);
  }
  return arr;
}


module.exports.UaRevoGameDictionary = UaRevoGameDictionary;