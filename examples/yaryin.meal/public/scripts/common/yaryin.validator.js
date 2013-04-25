/// <reference path="../_reference.js" />
(function ($) {
    yaryin.namespace('yaryin.validator');
    yaryin.validator.extend({
        init: function (form) {
            form.find('input,select,textarea')
        }
        , parseForm: function ($form) {
            $form.validate(this.getValidObj($form));
        }
        , getValidObj: function ($form, validCfg) {
            validCfg = validCfg || {
                rules: {}
                , messages: {}
            };
            var self = this;
            $form.find('input,select,textarea').each(function () {
                self.parseInput($(this), validCfg);
            });
            return validCfg;
        }
        , parseInput: function ($input, validCfg) {
            var self = this
            , inputName = $input.attr('name')
            , input = $input[0]
            , attrs = input.attributes
            , attrArr = []
            , pre = 'data-val-';

            if ($input.attr('data-val') && $input.is(':enabled')) {
                if (!validCfg.rules[inputName]) { validCfg.rules[inputName] = {}; }
                if (!validCfg.messages[inputName]) { validCfg.messages[inputName] = {}; }
                for (var i = 0; i < attrs.length; i++) {
                    attrArr.push(attrs[i]);
                }
                var dataValAttrs = attrArr.each(function (attr) {
                    var name = attr.name;
                    if (attr.name.indexOf(pre) >= 0) {
                        var methodName = self._getOrgAttrName(name.replace(pre, ''));
                        if (methodName.indexOf('-') < 0) {
                            var ruleMessage = $input.attr(name);
                            validCfg.messages[inputName][methodName] = ruleMessage;
                            validCfg.rules[inputName][methodName] = self._getRuleParam($input, name, methodName, dataValAttrs, validCfg);
                        }
                    }
                });
            }
        }
        , _getOrgAttrName: function (attrName) {
            var adapter = {
                'equalto': 'equalTo',
                dateiso: 'dateISO'
            };

            return adapter[attrName] || attrName;
        }
        , _getRuleParam: function ($input, methodPath, methodName, dataValAttrs, validCfg) {
            var param = $input.attr(methodPath + '-param')
            , inputName = $input.attr('name');
            if (param) {
                return param;
            }

            return true;
        }
    });
})(jQuery);