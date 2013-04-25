/// <reference path="../_references.js" />
(function () {
    var app = {
        initView: function () { }
        , initDoc: function () { }
    };

    yaryin.event.hook(app, 'initView,initDoc');

    app.executePageEvents = function (eventPaths, args) {
        eventPaths = eventPaths.where(function (o) { return !!o; });
        if (eventPaths.length > 0) {
            for (var i = 0; i < eventPaths.length; i++) {
                yaryin.event.get('ready', eventPaths.take(i + 1).join('/'))(args);
            }
        } else {
            yaryin.event.get('ready', 'home')(args);
        }
    }

    yaryin.app = app;

    $(function () {
        app.initView(document);
        app.executePageEvents(window.location.pathname.split('/'), [$(document)]);
        app.initDoc();
    });

})();