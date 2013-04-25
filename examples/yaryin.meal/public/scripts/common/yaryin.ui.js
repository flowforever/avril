/// <reference path="yaryin.js" />
/// <reference path="yaryin.tools.js" />


(function (yaryin) {
    String.prototype.localize = function () {
        return this.toString();
    }
    yaryin.toArray = function (arg) {
        var arr = [];
        if (arg.length) {
            for (var i = 0; i < arg.length; i++) {
                arr.push(arg[i]);
            }
        }
        return arr;
    }
})(yaryin);


yaryin.namespace('yaryin.ui');

//#region yaryin.ui.helper
(function (yaryin) {
    var datakey = 'localizeKey';

    $.fn.localize = function (group) {
        this.data(datakey, this.data(datakey) || this.html());
        this.attr('localize', 'false');
        if (group) {
            this.attr('loaclize-group', group);
        }
        return this;
    }

    var helper = yaryin.ui.helper = {
        divStr: '<div/>'
                , linkStr: '<a/>'
                , tagBuilder: function (tag, attrs) {
                    var $el = $(this.tagStr[tag]);
                    if (attrs) {
                        $el.attr(attrs);
                    }
                    return $el;
                }
                , localize: {}
                , tagStr: {}
    };

    //#region tags
    var tags = 'a,abbr,acronym,address,applet,area,b,base,basefont,bdo,big,blockquote,body,br,button,canvas,caption,center,cite,code,col,colgroup,dd,del,dfn,dir,div,dl,dt,em,fieldset,font,form,frame,frameset,h1,h2,h3,h4,h5,h6,head,hr,html,i,iframe,img,input,ins,isindex,kbd,label,legend,li,link,map,menu,meta,noframes,noscript,object,ol,optgroup,option,p,param,pre,q,s,samp,script,select,small,span,strike,strong,style,sub,sup,table,tbody,td,textarea,tfoot,th,thead,title,tr,tt,u,ul,var';
    //#endregion

    tags.split(',').each(function (tag) {
        var fnName = '$' + tag;
        helper.tagStr[tag] = '<' + tag + '/>';
        helper[fnName] = function (attrs) {
            return helper.tagBuilder(tag, attrs);
        }
        helper.localize[fnName] = function (options, group) {
            var $el = helper[fnName].apply(helper, arguments);
            $el.localize(group);
            return $el;
        }
    });

    (function special() {
        var org$a = helper.$a;
        helper.$a = function (attrs) {
            if (!attrs || !attrs.href) {
                attrs = attrs || {};
                attrs.href = 'javascript:;';
            }
            org$a.call(helper, attrs);
        }
    })();
})(yaryin);
//#endregion

//#region yaryin.ui.msg
(function ($, yaryin) {
    yaryin.createlib('yaryin.ui.msg', function (options) {
        var config = $.extend(true, this.options(), {
            $container: 'body'
        }, options)
        , generateMsg = function () {
            $msg = $('<div class="alert hide"> <button type="button" class="close" data-dismiss="alert">×</button> <strong/>:  <span/>  </div>').attr('guid', yaryin.guid());
            $msg.find('button').click(function () {
                $msg.fadeOut();
            });
        }
        , $msg;

        this._parseConfig();

        function setMsg($msg, msg) {
            $msg.show();
            $msg.removeClass('alert-success alert-error alert-info').addClass('alert-' + msg.type);
            $msg.find('strong').html(msg.title);
            $msg.find('span').html(msg.msg);
        }

        this.show = function ($container, msg) {
            if (arguments.length == 1) {
                msg = arguments[0];
                $container = this.$container();
            } else if (arguments.length == 2) {
                config.$container = $container;
            }
            if ($container.children('div.alert').length == 0) {
                generateMsg();
                $msg.prependTo($container);
            } else {
                $msg = $container.find('div.alert');
            }
            setMsg($msg, msg);
            return this;
        }

        this.showInBody = function (msg) {
            config.$container = 'body';
            this.show('body', msg);
            return this;
        }
    });
})(jQuery, yaryin);
//#endregion

//#region yaryin.ui.pop
(function ($, yaryin) {
    //#region private
    var popList = []
    , _divStr = '<div class="modal hide"> \
                  <div class="modal-header"> \
                    <button type="button" class="close" data-dismiss="modal">×</button> \
                    <h3>Untitle</h3> \
                  </div> \
                  <div class="modal-body"> \
                    \
                  </div> \
                  <div class="modal-footer"> \
                    <div class="span2 pull-left"> \
                        <div class="progress progress-striped active hide"> \
                          <div class="bar" style="width: 40%;"></div> \
                        </div>    \
                    </div> \
                    <div class="span4 pull-right"> \
                        <a href="#" class="btn" data-dismiss="modal">Close</a> \
                        <a href="#" class="btn btn-primary">Save changes</a> \
                    </div> \
                  </div> \
                </div>';
    //#endregion

    yaryin.createlib('yaryin.ui.pop', function (options) {
        var config = $.extend(this.options(), {
            $pop: _divStr
            , $content: null
            , $handle: null
            , title: ''
            , content: ''
            , draggable: false
            , resizable: false
            , width: 780
            , height: 600
            , buttons: 'Save changes,Close'.split(',')
            , scroll: true
            , esc: true
            , showFooter: false
            , cache: false
        }, options)
        , self = this
        , $title = function () { return self.$pop().find('div.modal-header:eq(0)>h3'); }
        , $header = function () { return self.$pop().find('div.modal-header:eq(0)'); }
        , $footer = function () { return self.$pop().find('div.modal-footer:eq(0)'); }
        , $content = function () { return self.$pop().find('div.modal-body:eq(0)'); }
        , $progress = function () {
            return self.$pop().find('div.modal-footer:eq(0) div.progress.progress-striped.active');
        }
        , _url
        , beginProgress = function () {
            var percent = 0;
            var $bar = $progress().find('div.bar').css('width', '0%');
            if (beginProgress.intervalId) {
                clearInterval(beginProgress.intervalId);
            }
            beginProgress.intervalId = setInterval(function () {
                $progress().show();
                //$progress().removeClass('progress-info progress-success');
                if (percent < 30) {
                    //$progress().addClass('progress-info');
                } else if (percent > 80) {
                    //$progress().addClass('progress-success');
                }
                $bar.show();
                $bar.css('width', (percent++) + '%');

                if (percent == 100) {
                    percent = 5;
                    $bar.hide();
                }
            }, 80);
        }
        , hideProgress = function () {
            if (beginProgress.intervalId) {
                clearInterval(beginProgress.intervalId);
            }
            $progress().fadeOut();
        };

        this._parseConfig($);

        $content().html(config.content);

        $title().html(config.title);

        this._requestCounter = {};

        this.load = function (url) {
            if (isNaN(this._requestCounter[url])) {
                this._requestCounter[url] = 0;
            } else {
                this._requestCounter[url]++;
            }
            if (this.events.beforeLoad([url, this])) {
                self.$pop().css({
                    'opacity': 0.3
                }).animate({
                    'opacity': 0.9
                }, 5000);

                _url = url;

                var cacheKey = 'popup-content:' + _url;

                function onLoaded(html) {
                    yaryin.tools.cache(cacheKey, html);
                    self.$pop().stop(true).css('opacity', 1);
                    if (self.events.onLoad([html])) {
                        hideProgress();
                        $content().html(html);
                        $title().html($content().find('h3').hide().html());
                        self.events.onLoadHandle([$content(), self])
                    }
                }

                if (config.cache && yaryin.tools.cache(cacheKey) && (!yaryin.tools.template.versionChanged || this._requestCounter[url] > 0)) {
                    onLoaded(yaryin.tools.cache(cacheKey));
                } else {
                    beginProgress();
                    $.ajax({
                        url: url
                        , data: {
                            date: new Date().getTime()
                        }
                        , success: onLoaded
                        , error: function () {
                            self.hide();
                        }
                    });
                }


            }
        }

        this.reload = function () {
            this.load(_url);
        }

        this.show = function () {
            popList.push(this);
            if (this.$pop().length == 0) {
                this.$pop().hide().appendTo('body');
            }
            this.$pop().modal({
                keyboard: config.esc
            });
            this.$pop().bind('hidden', function () {
                self.events.onHide();
            });
            $('div.modal-backdrop.in').unbind('click');
            if (config.draggable) {
                this.$pop().css({
                    position: 'absolute'
                    , width: config.width
                    , height: config.height
                });
            }
            if (config.resizable) {
                adjustContentHeight();
            }
        }

        this.hide = function () {
            popList.removeElement(this);
            this.$pop().modal('hide');
            this.events.onHide([this]);
        }

        this.init = function () {
            if (this.$handle().length) {
                var $handle = this.$handle()
                    , href = $handle.attr('href')
                    , isEl = false;

                if (href.indexOf('#') > 0) {
                    config.$pop = href.substring(href.indexOf('#'));
                    isEl = true;
                }

                $handle.click(function (e) {
                    e.preventDefault();
                    if (!isEl) { self.load($(this).attr('href')); }
                    self.show();
                });

                if (config.draggable) {
                    this.$pop().draggable({
                        handle: $title()
                    });
                }
                if (config.resizable) {
                    initResize();
                }
            }
            initButton();
            initScroll();
            initFooter();
            return this;
        }

        function initButton() {
            if (config.buttons) {
                var $buttonArea = $footer().find('div.span4');
                $buttonArea.html('');
                config.buttons.each(function (obj) {
                    var name = obj;
                    var text = obj;
                    var cls = 'btn'
                    if (typeof obj == 'object') {
                        name = obj.name;
                        text = obj.text;
                        cls = obj.cls = obj.cls || 'btn';
                        if (typeof obj.fun == 'function') {
                            self.onButtonClick(function (n, el) {
                                if (n == name) {
                                    obj.fun(n, el);
                                }
                            });
                        }
                    }
                    $('<a href="javascript:;"/>').addClass(cls).html(text)
                    .click(function () {
                        self.onButtonClick([name, $(this)]);
                    }).appendTo($buttonArea);
                });
            }
        }

        function initResize() {
            self.$pop().resizable({
                resize: function () {
                    adjustContentHeight();
                }
            });
        }

        function initScroll() {
            if (config.scroll) {
                $content().css('overflow', 'auto');
            } else {
                $content().css('overflow', 'hidden');
            }
        }

        function initFooter() {
            if (config.showFooter) {
                $footer().show();
            } else {
                $footer().hide();
            }
        }

        function adjustContentHeight() {
            $content().height(self.$pop().height() - (config.showFooter ? $footer().height() : 0) - $header().height() - 70);
        }

        this.events.onOptionChange(function (key, newConfig, oldConfig) {
            switch (key) {
                case 'width': {
                    self.$pop().width(newConfig[key]);
                    break;
                }
                case 'height': {
                    self.$pop().height(newConfig[key]);
                    break;
                }
                case 'resizable': {
                    if (newConfig[key]) {
                        if (!self.$pop().hasClass('ui-resizable')) {
                            self.$pop().resizable();
                        }
                    } else {
                        if (self.$pop().hasClass('ui-resizable')) {
                            self.$pop().resizable('disable');
                            self.$pop().resizable('destory');
                        }
                    }
                    break;
                }
                case 'draggable': {
                    if (newConfig[key]) {
                        if (!self.$pop().hasClass('ui-draggable')) {
                            self.$pop().draggable();
                        }
                    } else {
                        if (self.$pop().hasClass('ui-draggable')) {
                            self.$pop().draggable('disale');
                            self.$pop().draggable('destory');
                        }
                    }
                    break;
                }
                case 'title': {
                    $title().html(newConfig[key]);
                    break;
                }
                case 'content': {
                    $content().html(newConfig[key]);
                    break;
                }
                case 'buttons': {
                    initButton();
                    break;
                }
                case 'scroll': {
                    initScroll();
                    break;
                }
                case 'showFooter': {
                    initFooter();
                }
            }
        });

        this.events.beforeLoad = yaryin.event.get('beforeLoad', this);

        this.events.onLoad = yaryin.event.get('onLoad', this);

        this.events.onLoadHandle = yaryin.event.get('onLoadHandle', this);

        this.events.onHide = yaryin.event.get('onHide', this);

        this.onButtonClick = yaryin.event.get('onButtonClick', this);

        this.onButtonClick(function (name, el) {
            switch (name) {
                case 'Close': {
                    self.hide();
                    break;
                }
                case 'Save changes': {
                    self.$pop().find('form').submit();
                    break;
                }
            }
        });

        this.hook('init,hide,show');
    });

    yaryin.alert = function (msg, func) {
        func = func || function () { }
        var $alert = yaryin.ui.pop({
            width: 300
            , height: 200
            , alert: 'Alert'.localize()
            , buttons: ['OK']
            , showFooter: true
        }).init();
        $alert.options('content', msg).show();
        $alert.onButtonClick(function (name, el) {
            func();
            $alert.hide();
        });
        $alert.$pop().find('a:eq(0)').focus();
    }

    yaryin.confirm = function (msg, func) {
        func = func || function () { }
        var $confirm = yaryin.ui.pop({
            width: 320
            , height: 200
            , title: 'Confirm'.localize()
            , buttons: 'Confirm,Cancel'.split(',')
            , showFooter: true
        }).init();
        $confirm.options('content', msg).show();
        $confirm.onButtonClick(function (name, $el) {
            switch (name) {
                case 'Confirm': {
                    func(true);
                    $confirm.hide();
                    break;
                }
                case 'Cancel': {
                    func(false);
                    $confirm.hide();
                    break;
                }
            }
        });
        $confirm.$pop().find('a:eq(0)').focus();
        console.log($confirm.$pop().find('a:eq(0)')[0])
    }

    yaryin.ui.pop.toJQ('pop', function (options) {
        if (this.attr('data-pop')) {
            try {
                $.extend(true, options, eval('(' + this.attr('data-pop') + ')'));
            }
            catch (E) { }
        }
        options.$handle = this;
    });

    yaryin.ui.popContext = {
        popList: function () {
            return popList;
        }
        , getCurrent: function () {
            return popList.first();
        }
    };
})(jQuery, yaryin);
//#endregion

//#region yaryin.cookie
(function (yaryin) {
    yaryin.namespace('yaryin.ui');
    yaryin.ui.cookie = {
        get: function (name) {
            var arr = document.cookie.match(new RegExp("(^| )" + name + "=([^;]*)(;|$)"));
            if (arr != null) return unescape(arr[2]); return null;
        }
        , set: function (name, value, days) {
            days = days || 30;
            var exp = new Date();
            exp.setTime(exp.getTime() + days * 24 * 60 * 60 * 1000);
            document.cookie = name + "=" + escape(value) + ";expires=" + exp.toGMTString();
        }
        , del: function (name) {
            var exp = new Date();
            exp.setTime(exp.getTime() - 1);
            var cval = this.get(name);
            if (cval != null) document.cookie = name + "=" + cval + ";expires=" + exp.toGMTString();
        }
        , getObj: function (key) {
            return window.JSON ? window.JSON(this.get(key)) : eval('(' + this.get(key) + ')');
        }
        , setObj: function (key, obj) {
            this.set(key, window.JSON ? window.JSON.stringify(obj) : $.toJSON(obj));
        }
    };
})(yaryin);
//#endregion

//#region yaryin.ui.progressbar
(function ($, yaryin) {
    yaryin.createlib('yaryin.ui.progressbar', function (options) {
        var config = $.extend(true, this.options(), {
            auto: true
            , stop: false
        }, options)
        , $el = yaryin.ui.helper.$div().css({
            width: config.width || 250
            , height: config.height || 20
            , position: config.position || 'fixed'
            , bottom: config.bottom || 0
            , right: config.right || 0
            , display: 'none'
            , 'z-index': 999999999
        }).appendTo('body')
        , self = this
        , guid = yaryin.guid()
        , interval;

        $el.progressbar();

        function run() {

            stop();

            config.stop = false;
            var i = 0;
            interval = setInterval(function () {
                if (i++ == 100) {
                    i = 0;
                }
                if (!config.stop)
                    $el.progressbar("value", i);
            }, 50);
        }

        function stop() {
            config.stop = true;
            try {
                clearInterval(interval);
            } catch (E) { }
        }

        if (config.auto) {
            run();
        }

        this.show = function () {
            $el.show();
            run();
        }

        this.hide = function () {
            $el.hide();
            stop();
        }
    }, {
        bottom_right: (function () {
            var ins;
            return function () {
                if (!ins) {
                    ins = yaryin.ui.progressbar();
                }
                return ins;
            }
        })()
    });
})(jQuery, yaryin);
//#endregion

//#region yaryin.ui.ajaxFrame
(function ($, yaryin) {
    //#region jquery.hashchange
    (function ($, window, undefined) {
        '$:nomunge'; // Used by YUI compressor.

        // Reused string.
        var str_hashchange = 'hashchange',

    // Method / object references.
    doc = document,
    fake_onhashchange,
    special = $.event.special,

    // Does the browser support window.onhashchange? Note that IE8 running in
    // IE7 compatibility mode reports true for 'onhashchange' in window, even
    // though the event isn't supported, so also test document.documentMode.
    doc_mode = doc.documentMode,
    supports_onhashchange = 'on' + str_hashchange in window && (doc_mode === undefined || doc_mode > 7);

        // Get location.hash (or what you'd expect location.hash to be) sans any
        // leading #. Thanks for making this necessary, Firefox!
        function get_fragment(url) {
            url = url || location.href;
            return '#' + url.replace(/^[^#]*#?(.*)$/, '$1');
        };

        $.fn[str_hashchange] = function (fn) {
            return fn ? this.bind(str_hashchange, fn) : this.trigger(str_hashchange);
        };

        $.fn[str_hashchange].delay = 50;

        // Override existing $.event.special.hashchange methods (allowing this plugin
        // to be defined after jQuery BBQ in BBQ's source code).
        special[str_hashchange] = $.extend(special[str_hashchange], {
            // Called only when the first 'hashchange' event is bound to window.
            setup: function () {
                // If window.onhashchange is supported natively, there's nothing to do..
                if (supports_onhashchange) { return false; }

                // Otherwise, we need to create our own. And we don't want to call this
                // until the user binds to the event, just in case they never do, since it
                // will create a polling loop and possibly even a hidden Iframe.
                $(fake_onhashchange.start);
            },

            // Called only when the last 'hashchange' event is unbound from window.
            teardown: function () {
                // If window.onhashchange is supported natively, there's nothing to do..
                if (supports_onhashchange) { return false; }

                // Otherwise, we need to stop ours (if possible).
                $(fake_onhashchange.stop);
            }
        });

        // fake_onhashchange does all the work of triggering the window.onhashchange
        // event for browsers that don't natively support it, including creating a
        // polling loop to watch for hash changes and in IE 6/7 creating a hidden
        // Iframe to enable back and forward.
        fake_onhashchange = (function () {
            var self = {},
      timeout_id,

      // Remember the initial hash so it doesn't get triggered immediately.
      last_hash = get_fragment(),

      fn_retval = function (val) { return val; },
      history_set = fn_retval,
      history_get = fn_retval;

            // Start the polling loop.
            self.start = function () {
                timeout_id || poll();
            };

            // Stop the polling loop.
            self.stop = function () {
                timeout_id && clearTimeout(timeout_id);
                timeout_id = undefined;
            };

            // This polling loop checks every $.fn.hashchange.delay milliseconds to see
            // if location.hash has changed, and triggers the 'hashchange' event on
            // window when necessary.
            function poll() {
                var hash = get_fragment(),
        history_hash = history_get(last_hash);

                if (hash !== last_hash) {
                    history_set(last_hash = hash, history_hash);

                    $(window).trigger(str_hashchange);
                } else if (history_hash !== last_hash) {
                    location.href = location.href.replace(/#.*/, '') + history_hash;
                }

                timeout_id = setTimeout(poll, $.fn[str_hashchange].delay);
            };

            // vvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvv
            // vvvvvvvvvvvvvvvvvvv REMOVE IF NOT SUPPORTING IE6/7/8 vvvvvvvvvvvvvvvvvvv
            // vvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvv
            $.browser.msie && !supports_onhashchange && (function () {
                // Not only do IE6/7 need the "magical" Iframe treatment, but so does IE8
                // when running in "IE7 compatibility" mode.

                var iframe,
        iframe_src;

                // When the event is bound and polling starts in IE 6/7, create a hidden
                // Iframe for history handling.
                self.start = function () {
                    if (!iframe) {
                        iframe_src = $.fn[str_hashchange].src;
                        iframe_src = iframe_src && iframe_src + get_fragment();

                        // Create hidden Iframe. Attempt to make Iframe as hidden as possible
                        // by using techniques from http://www.paciellogroup.com/blog/?p=604.
                        iframe = $('<iframe tabindex="-1" title="empty"/>').hide()

            // When Iframe has completely loaded, initialize the history and
            // start polling.
            .one('load', function () {
                iframe_src || history_set(get_fragment());
                poll();
            })

            // Load Iframe src if specified, otherwise nothing.
            .attr('src', iframe_src || 'javascript:0')

            // Append Iframe after the end of the body to prevent unnecessary
            // initial page scrolling (yes, this works).
            .insertAfter('body')[0].contentWindow;

                        // Whenever `document.title` changes, update the Iframe's title to
                        // prettify the back/next history menu entries. Since IE sometimes
                        // errors with "Unspecified error" the very first time this is set
                        // (yes, very useful) wrap this with a try/catch block.
                        doc.onpropertychange = function () {
                            try {
                                if (event.propertyName === 'title') {
                                    iframe.document.title = doc.title;
                                }
                            } catch (e) { }
                        };
                    }
                };

                // Override the "stop" method since an IE6/7 Iframe was created. Even
                // if there are no longer any bound event handlers, the polling loop
                // is still necessary for back/next to work at all!
                self.stop = fn_retval;

                // Get history by looking at the hidden Iframe's location.hash.
                history_get = function () {
                    return get_fragment(iframe.location.href);
                };

                // Set a new history item by opening and then closing the Iframe
                // document, *then* setting its location.hash. If document.domain has
                // been set, update that as well.
                history_set = function (hash, history_hash) {
                    var iframe_doc = iframe.document,
          domain = $.fn[str_hashchange].domain;

                    if (hash !== history_hash) {
                        // Update Iframe with any initial `document.title` that might be set.
                        iframe_doc.title = doc.title;

                        // Opening the Iframe's document after it has been closed is what
                        // actually adds a history entry.
                        iframe_doc.open();

                        // Set document.domain for the Iframe document as well, if necessary.
                        domain && iframe_doc.write('<script>document.domain="' + domain + '"</script>');

                        iframe_doc.close();

                        // Update the Iframe's hash, for great justice.
                        iframe.location.hash = hash;
                    }
                };
            })();
            // ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
            // ^^^^^^^^^^^^^^^^^^^ REMOVE IF NOT SUPPORTING IE6/7/8 ^^^^^^^^^^^^^^^^^^^
            // ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

            return self;
        })();
    })(jQuery, this);
    //#endregion

    yaryin.createlib('yaryin.ui.ajaxframe', function (options) {
        var config = $.extend(this.options(), {
            identifyPre: '#/'
            , $container: '#ajax-container'
            //, effect: 'clip'
            , showEffect: 'slide'
            , hideEffect: 'slide'
            , enabled: true
            , cache: false
        }, options)
        , self = this
        , _firstContent
        , cache = {}
        , triggerChange = true;

        this._parseConfig();

        function _isAjaxHash() {
            var hash = window.location.hash;
            if (hash.indexOf(config.identifyPre) == 0) {
                return true;
            }
            return false;
        }

        function _getUrl() {
            return window.location.hash.substring(1);
        }

        function _getCache(url) {
            return cache[url || _getUrl()];
        }

        function setContent(html, hasEffect) {
            if (hasEffect != false) {
                self.$container()
                .hide(config.hideEffect || config.effect, function () {
                    self.$container().html(html);
                    self.onLoad([self, self.$container()]);

                    self.$container().show(config.showEffect || config.effect);
                });
            } else {
                self.$container().html(html);
                self.onLoad([self, self.$container()]);
            }
        }

        function loadContent(url, hasEffect) {
            self._lasturl = url;
            if (!_getCache(url) || !config.cache) {
                $.ajax({
                    url: url
                    , data: { _yaryin_guid: yaryin.guid() }
                    , success: function (response) {
                        var isJSON = false, obj;
                        try {
                            var json = $('<div/>').html(response).text();
                            obj = eval('(' + json + ')');
                            isJSON = true;
                        }
                        catch (E) { }
                        if (isJSON) {
                            if (response.innerType) {
                                yaryin[response.innerType](response.msg, function () {
                                    yaryin.event.get('response.' + response.innerType)(yaryin.toArray(arguments).push(url));
                                });
                            } else {
                                yaryin.ui.msg().show('body>div.container.main-page', obj);
                            }
                        }
                        else {
                            cache[url] = response;
                            setContent(response, hasEffect);
                        }
                    }
                });
            } else if (config.cache && _getUrl(url)) {
                setContent(_getCache(url));
            }
        }

        this.loadContent = loadContent;

        this.onLoad = yaryin.event.get('onLoad', this);

        this.reload = function () {
            if (self._lasturl) {
                this.loadContent(self._lasturl, false);
            }
            return this;
        }

        this.beforeLoad = yaryin.event.get('beforeLoad', this);

        this.navTo = function (url) {
            if (this.options().enabled) {
                window.location = '#' + url;
                triggerChange = false;
                this.loadContent(url);
            }
        }

        this.parseLink = function (links) {
            $(links).each(function () {
                if (!$(this).data('ajaxframe-parse') && !$(this).is('.no-ajax')) {
                    $(this).click(function (e) {
                        if (self.options().enabled) {
                            e.preventDefault();
                            self.navTo($(this).attr('href'));
                        }
                    });
                    $(this).data('ajaxframe-parse', true)
                }
            });
        }

        this.init = function () {
            _firstContent = this.$container().html();
            $(window).hashchange(function () {
                if (self.options().enabled) {
                    if (triggerChange && _isAjaxHash()) {
                        self.loadContent(_getUrl());
                    } else if (triggerChange && !window.location.hash) {
                        setContent(_firstContent);
                    }
                }

                triggerChange = true;
            });
            if (_isAjaxHash() && self.options().enabled) {
                self.loadContent(_getUrl(), false);
            }
            this.parseLink('a.ajaxlink');
        }

        this.getUrl = function () {
            return _getUrl();
        }
    });

    window.ajaxFrame = yaryin.ui.ajaxframe();
})(jQuery, yaryin);
//#endregion

//#region remove some adblock
(function (yaryin) {
    yaryin.createlib('yaryin.ui.antiMontherFucker', function (options) {
        var config = $.extend(true, this.options(), {
            myIframe: '.yaryin-iframe'
            , reportUrl: ''
        }, options);

        var times = 0;
        (function remove() {
            $('iframe').each(function () {
                if (!$(this).is(config.myIframe)) {
                    var src = $(this).attr('src');
                    $.ajax({
                        url: config.reportUrl
                        , data: {
                            src: src
                        }
                    });
                    $(this).remove();
                }
            });
            setTimeout(remove, 1000 + (times++) * 10)
        })();
    });
    yaryin.ui.antiMontherFucker();
})(yaryin);
//#endregion