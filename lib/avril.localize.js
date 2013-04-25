var path = require('path')
    , avril = require('./avril')
    , fs = require('fs');

var defLanguages = ['zh-CN', 'en']
, languages = "id=Bahasa Indonesia,ms=Bahasa Melayu,ca=Català,cs=Čeština,cy=Cymraeg,da=Dansk,de=Deutsch,et=Eesti keel,en-GB=English (UK),en=English (US),es=Español,es-419=Español (Latinoamérica),eu=Euskara,tl=Filipino,fr=Français,hr=Hrvatski,it=Italiano,is=Íslenska,sw=Kiswahili,lv=Latviešu,lt=Lietuvių,hu=Magyar,nl=Nederlands,no=Norsk (Bokmål),pl=Polski,pt-BR=Português (Brasil),pt-PT=Português (Portugal),ro=Română,sk=Slovenčina,sl=Slovenščina,fi=Suomi,sv=Svenska,vi=Tiếng Việt,tr=Türkçe,el=Ελληνικά,ru=Русский,sr=Српски,uk=Українська,bg=Български,iw=Hebrew,ar=Arabic,fa=Persian,ur=Urdu,mr=मराठी,hi=हिन्दी,bn=বাংলা,gu=ગુજરાતી,ta=தமிழ்,te=తెలుగు,kn=ಕನ್ನಡ,ml=മലയാളം,th=ภาษาไทย,am=አማርኛ (Amharic),zh-TW=中文（繁體）,zh-CN=中文（简体）,ja=日本語,ko=한국어".split(',');

var localizeObj = {};

function ensureKey(obj, key) {
    if (!obj[key]) { obj[key] = {} };
    return obj[key];
}

function _keyValue(culture, str, group) {

    var lanPack = localizeObj[culture] || (localizeObj[culture] = { group: {}, keyValues: {} });

    if (culture != 'standard') {
        _saveToStandardPack(str, group);
    }

    if (group) {
        group = group.toLowerCase();
        ensureKey(lanPack.group, group);
        if (lanPack.group[group][str]) {
            return lanPack.group[group][str];
        } else {
            lanPack.group[group][str] = '';

            if (lanPack.keyValues[str]) {
                exports.defaultProvider.set(culture, localizeObj);
                return lanPack.keyValues[str];
            } else {
                lanPack.keyValues[str] = '';
                exports.defaultProvider.set(culture, localizeObj);
            }
        }
    } else {
        if (lanPack.keyValues[str]) {
            return lanPack.keyValues[str];
        } else {
            lanPack.keyValues[str] = '';
            exports.defaultProvider.save(culture);
        }
    }
    return str;
}

String.prototype.localize = function (helper, group) {
    var culture;
    if (typeof (helper) == 'object') {
        culture = exports.currentLanguage(helper.req(), helper.res());
    } else {
        culture = helper;
    }
    return _keyValue(culture, this, group || (!helper.url ? '' : (helper.url.action() + '')));
}

var exports = module.exports = {
    languages: languages
    , localizeObj: localizeObj
    , provider: {
        file: {
            init: function (avril) {
                this.avril = avril;
            }
            , get: function (language, localizeObj, callback) {
                fs.readFile(this._filePath(language), {
                    encoding: 'utf8'
                }
                , function (err, file) {
                    if (!err) {
                        language = language.toLowerCase();
                        localizeObj[language] = localizeObj[language] || {};
                        try {
                            avril.extend(true, localizeObj[language], JSON.parse(file));
                            callback(localizeObj[language]);
                        } catch (E) {
                            avril.log(E);
                        }

                    }
                });
            }
            , set: function (language, localizeObj) {
                language = language.toLowerCase();

                var lan = localizeObj[language];

                var json = JSON.stringify(lan, function (key, value) {
                    return value;
                }, 4);

                fs.writeFile(this._filePath(language), json, {
                    encoding: 'utf8'
                });
            }
            , _filePath: function (language) {
                return path.join(this.avril._rootDir, 'languages', language + '.txt');
            }
        }
        , mongodb: {
            init: function () { }
            , get: function () { }
            , set: function () { }
        }
        , reids: {
            init: function () { }
            , get: function () { }
            , set: function () { }
        }
    }
    , currentLanguage: function (req, res) {
        var auth = avril.auth.get();
        var language = req.param('language') || auth.cookie(req, res).get('language');
        if (req.param('language')) {
            auth.cookie(req, res).set('language', req.param('language'));
        }
        if (language) {
            return language.toLowerCase();
        } else {
            auth.cookie(req, res).set('language', defLanguages[0]);
        }
        return defLanguages[0].toLowerCase();
    }
    , languagePack: function (language) {
        language = language.toLowerCase();
        return this.localizeObj[language] || (this.localizeObj[language] = { group: {}, keyValues: {} });
    }
    , init: function (avril, options) {
        this.avril = avril;

        this.defaultProvider = this.provider[options.provider] || this.provider.file;

        this.defaultProvider.init(avril);

        var self = this;

        languages.forEach(function (ln, index) {

            var lan = ln.split('=')[0];

            self.defaultProvider.get(lan, self.localizeObj);
        });
    }
    , localize: function (language, str, group) {
        return _keyValue(language, str, group);
    }
};

function _saveToStandardPack(str, group) {
    var lanPack = exports.languagePack('standard');
    _keyValue('standard', str, group);
}

