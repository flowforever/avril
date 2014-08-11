var avril = require('avril')
, siteSetting = avril.getConfig('siteSetting')
, pageSetting = siteSetting.pageSetting
, db = avril.require('data.db')
, articles = db.Article
, rates = db.ArticleRate
, comments = db.ArticleComment
, actRecords = db.ActiveRecords
, delRecords = db.UserDelRecords
;

module.exports = {
    getLatest: function (callback) {
        articles.find().sort('-date').limit(30).exec(function (err, doc) {
            callback(err, doc && doc.map(function (o) { return o; }));
        });
    }

    , hot: function (query, type, callback, index, num) {
        index = index || pageSetting.index;
        num = num || pageSetting.num;
        articles.count(query, function (err, count) {
            articles.find(query || {}).sort('-total -date').skip(index * num).limit(num).exec(function (err2, docs) {
                callback(err || err2, docs, Math.floor((count - 1) / num));
            })
        });
    }

    , page: function (query, callback, index, num) {
        index = index || pageSetting.index;
        num = num || pageSetting.num;
        articles.count(query, function (err, count) {
            articles.find(query || {}).sort('-date').skip(index * num).limit(num).exec(function (err2, docs) {
                callback(err || err2, docs, Math.floor((count - 1) / num));
            })
        });
    }

    , rate: function (retObj, callback) {
        var self = this;
        self.getArticle(retObj.articleId, function (err, article) {
            actRecords.findOne({
                userId: retObj.userId
                , articleId: retObj.articleId
                , type: retObj.type
            }, function (err, record) {
                article.positive = article.positive || 0;
                article.negative = article.negative || 0;
                article.comment = article.comment || 0;
                article.total = Math.abs(article.positive || 0) + Math.abs(article.negative || 0) + Math.abs(article.comment || 0);

                if (!record) {
                    actRecords.add({
                        articleId: retObj.articleId
                        , date: new Date()
                        , userId: retObj.userId
                        , type: retObj.type
                        , rate: retObj.rate
                    }, function () {
                        retObj.rate > 0 ? article.positive++ : article.negative++;
                        article.del > 0 && article.del--;
                        article.save(callback);
                    });
                } else {
                    if (record.rate != retObj.rate) {
                        record.date = new Date();
                        record.rate = retObj.rate;
                        record.save(function () {
                            if (retObj.rate > 0) {
                                article.positive++;
                                article.negative > 0 && article.negative--;
                            } else {
                                article.positive > 0 && article.positive--;
                                article.negative++;
                            }
                            article.save(callback);
                        });
                    } else {
                        callback(null, article);
                    }
                }
            });
        });
    }

    , getArticle: function (articleId, func) {
        articles.findOne({ _id: articleId }, func);
    }

    , getDelRecords: function (userId, callback) {
        delRecords.find({ userId: userId }, callback);
    }

    , add: function (article, callback) {
        articles.add(article, callback);
    }

    , remove: function (id, userId, callback) {
        this.getArticle(id, function (err, article) {
            function doDel() {
                if (article) {
                    article.del = article.del || 0;
                    article.del++;
                    if (article.del >= siteSetting.rate.delNum) {
                        article.remove();
                    } else {
                        article.save();
                    }
                }
            }
            if (article.authorId == userId) {
                article.remove();
            } else {
                delRecords.findOne({
                    userId: userId
                    , articleId: id
                }, function (err, record) {
                    if (!record) {
                        delRecords.add({
                            userId: userId
                            , articleId: id
                        }, doDel);
                    }
                });
            }
            callback();
        });
    }
};