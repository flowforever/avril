/// <reference path="../_references.js" />
(function ($) {

    //#region app view init

    var app = yaryin.app;

    yaryin.app.initView.onInitView(function (initRes, context) {

        var $ctx = $(context)
            , $$ = function () {
                return $ctx.find.apply($ctx, arguments);
            };

        $$('a[confirm]').bind('click', function (e) {
            e.preventDefault();
            var handle = $(this);
            if (!handle.is('.disabled')) {
                yaryin.confirm(handle.attr('confirm'), function (r) {
                    if (r) {
                        document.location.href = handle.attr('href');
                    }
                });
            }
        });

        $$('a[ajax-confirm]').bind('click', function (e) {
            e.preventDefault();
            var handle = $(this);
            if (!handle.is('.disabled')) {
                yaryin.confirm(handle.attr('ajax-confirm'), function (r) {
                    if (r) {
                        var postData = {};

                        var postCfg = {
                            url: handle.attr('href')
                        , data: postData
                        , type: 'post'
                        , success: function (response) {
                            yaryin.ui.msg().show($$('table').parent(), response);
                            if (yaryin.event.get('success.beforeCommon', handle)([response])) {
                                yaryin.event.get('success.main', handle)([response]);
                            }
                        }
                        }

                        if (yaryin.event.get('beforePost', handle)([postData, postCfg])) {
                            $.ajax(postCfg);
                        }
                    }
                });
            }
        });

        $$('.dropdown').bind('click', function (e) {
            e.stopPropagation();
            var handle = $(this);
            var content = handle.find('.dropdown-menu');

            $('.dropdown-menu').not(content).slideUp();

            if (!content.is(':visible')) {
                content.slideDown();
            }
        });

        $$('a.patch-remove').each(function () {
            var handle = $(this)
                , $grid = $$('table.yaryin-grid').length == 1 ? $$('table.yaryin-grid') : $$(handle.attr('grid'))
                , checkeds;

            yaryin.event.get('beforePost', handle)(function (data) {
                checkeds = $grid.find('tbody input:checkbox[checked]');
                data.toRemove = checkeds.toArray().select(function () {
                    return $(this).val();
                });
            });

            yaryin.event.get('success.main', handle)(function (response) {
                if (checkeds.length == $grid.find('tbody tr').length) {
                    (ajaxFrame.options().enabled ? ajaxFrame : document.location).reload();
                } else {
                    checkeds.each(function (el) {
                        $(this).parents('tr:eq(0)').fadeOut(function () {
                            $(this).remove();
                        });
                    });
                }
            });
        });

        $$('table a.delete').each(function () {
            var handle = $(this), $grid = handle.parents('table:eq(0)');
            yaryin.event.get('beforePost', handle)(function (data) {
                checkeds = $grid.find('tbody input:checkbox[checked]');
                data.toRemove = [handle.parents('tr:eq(0)').find('input:checkbox').val()];
            });

            yaryin.event.get('success.main', handle)(function (response) {
                if (1 == $grid.find('tbody tr').length) {
                    (ajaxFrame.options().enabled ? ajaxFrame : document.location).reload();
                } else {
                    handle.parents('tr:eq(0)').fadeOut(function () {
                        $(this).remove();
                    });
                }
            });
        });

        $$('[data-pop]').each(function () {

            var $handler = $(this);
            $handler.pop({
                onLoadHandle: function ($content, pop) {

                    app.initView($content);

                    var href = $handler.attr('href');

                    if (href) {
                        app.executePageEvents(href.split('?')[0].split('/'), [$content, pop]);
                    }

                    yaryin.ui.progressbar.bottom_right().hide();
                }
                , beforeLoad: function () {
                    yaryin.ui.progressbar.bottom_right().show();
                }
                , onHide: function () {
                    yaryin.ui.progressbar.bottom_right().hide();
                }
            });
        });;

        $$('.nav.nav-tabs a').click(function () {
            $(this).tab('show');
            $($(this).attr('href')).show().siblings().hide();
        });

        //#region ajax form

        $$('form.ajax').each(function () {
            var form = $(this);
            var validCfg = yaryin.validator.getValidObj(form);

            form.validate($.extend(validCfg, {
                success: function (label) {
                    label.addClass('help-inline');
                    $(label).parents('div.control-group').removeClass('error').addClass('success');
                }
                , errorPlacement: function (label, $el) {
                    label.addClass('help-inline');
                    label.insertAfter($el);
                    $(label).parents('div.control-group').removeClass('success').addClass('error');
                },
                showErrors: function (errorMap, errorList) {
                    this.defaultShowErrors();
                    errorList.each(function (obj) {
                        var $line = $(obj.element).parents('div.control-group').removeClass('success').addClass('error');
                        $line.find('label.error').addClass('help-inline');
                    });
                }
            }));

            yaryin.event.get('form.success', form)(function (response) {
                yaryin.ui.msg().show(form, response);
            });

            yaryin.event.get('form.error', form)(function () {
                yaryin.ui.msg().show(form, {
                    msg: 'Something happends when communicating with the server .'
                    , title: 'Unknown error'
                    , type: 'error'
                });
            });

            form.ajaxForm({
                beforeSerialize: function () {
                    var valid = $(form).valid();

                    if (!valid) { return false; }

                    if (form.find('input:hidden[name="__datatype"]').length == 0) {
                        $('<input type="hidden" name="__datatype"/>').appendTo('form');
                    }
                    form.find('input:hidden[name="__datatype"]').val('ajax');
                    return yaryin.event.get('form.beforeSerialize', form)(arguments);
                }
                , beforeSubmit: function () {
                    return yaryin.event.get('form.beforeSubmit', form)(arguments);
                }
                , success: function () {
                    yaryin.event.get('form.success', form)(arguments);
                }
                , error: function () {
                    return yaryin.event.get('form.error', form)(arguments);
                }
            });
        });

        //#endregion
    });

    // hide dropdown menu
    yaryin.app.initDoc.onInitDoc(function () {
        var $doc = $(document);
        $doc.click(function () {
            $('.dropdown-menu').slideUp();
        });
    });

    //hightlight main menu & handle click event
    yaryin.app.initDoc.onInitDoc(function () {
        var currentUrl = function () {
            return location.pathname;
        }
        , activeCls = 'active'
        , hightlightEl = function (link) {
            $(link).parent().addClass(activeCls).siblings().removeClass(activeCls);
        };

        var $topMenu = $('#top-menu');

        $topMenu.find('ul.nav:eq(0) a').click(function () {
            hightlightEl(this);
        });

        var $cur = $topMenu.find('ul.nav:eq(0) a').toArray().first(function (a) { return currentUrl().indexOf($(a).attr('href')) == 0; })
        hightlightEl($cur);
    });

    //init login&register form 
    yaryin.app.initDoc.onInitDoc(function () {

        var form = $('#login-form,#register-form');

        var onFormSuccess = yaryin.event.get('form.success', form);

        onFormSuccess(function (res) {
            if (res.type == "success") {

                window.location.reload();

            }
        });
    });
    //#endregion

    //#region home events
    (function home_ready() {
        var homeReady = yaryin.event.get('ready', 'home');
        homeReady(function ($el, model, page) {
            $el.find('.bxslider').bxSlider({
                useCSS: false,
                auto: true
            });
        });
    })();
    //#endregion

    //#region login and register form events
    (function account_ready() {
        var accountReady = yaryin.event.get('ready', 'account');
        accountReady(function ($content, pop) {

        });
    })();
    //#endregion

})(jQuery);