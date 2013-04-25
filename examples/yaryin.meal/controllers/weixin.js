var avril = require('avril')
    , xml = require("node-xml")
    , wxServices = avril.require('services.weixin')
    , auth = avril.auth.get('weixin');

module.exports = {
    'message/:shopId': function (req, res, next, helper) {
        /* signature — 微信加密签名
         * timestamp — 时间戳
         * nonce — 随机数
         * echostr — 随机字符串
         */

        //todo validate
        res.send(req.param('echostr'));
    }
    , 'message/:shopId[post]': function (req, res, next, helper) {
        avril.log(req.rawData);
        weixinParser.parseString(req.rawData, function (err, result) {

            var context = {
                shopId: req.param('shopId')
            };
            wxServices.reply(result, context, function (xmlObj) {
                var returnXml = weixinGenerator.generateMsgTextXml(xmlObj);
                res.send(returnXml);
            });

        });
    }
    , 'testResponse/:shopId': function (req, res, next, helper) {
        var reply = req.param('reply');
        var result = {
            Content: reply
            , FromUserName: 'oVJm6jh6tquZp1iNq3LzhZjWcGf8'
            , ToUserName: 'gh_4f8f9c33830f'
        };
        result.shopId = req.param('shopId');
        wxServices.reply(result, function (xmlObj) {
            xmlObj.ToUserName = result.FromUserName;
            xmlObj.FromUserName = result.ToUserName;
            var returnXml = weixinGenerator.generateMsgTextXml(xmlObj);
            res.send(returnXml);
        });
    }
    , ':config': {
        provider: 'weixin'
    }
};