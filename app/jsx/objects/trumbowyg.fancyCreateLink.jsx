/* ===========================================================
 * trumbowyg.fancyCreateLink.js
 * Fancier insertLink plugin for Trumbowyg
 * http://alex-d.github.com/Trumbowyg
 * ===========================================================
 * Author : Martin Haye
 */

(function ($) {
    'use strict';

    // Plugin default options
    var defaultOptions = {
    };

    // If the plugin is a button
    function buildButtonDef (trumbowyg) {
        return {
            ico: 'createLink',
            fn: function () {
                var t = trumbowyg,
                    documentSelection = t.doc.getSelection(),
                    selectedRange = documentSelection.getRangeAt(0),
                    node = documentSelection.focusNode,
                    text = new XMLSerializer().serializeToString(selectedRange.cloneContents()) || selectedRange + '',
                    url,
                    title,
                    target;

                while (['A', 'DIV'].indexOf(node.nodeName) < 0) {
                    node = node.parentNode;
                }

                if (node && node.nodeName === 'A') {
                    var $a = $(node);
                    text = $a.text();
                    url = $a.attr('href');
                    if (!t.o.minimalLinks) {
                        title = $a.attr('title');
                        target = $a.attr('target');
                    }
                    var range = t.doc.createRange();
                    range.selectNode(node);
                    documentSelection.removeAllRanges();
                    documentSelection.addRange(range);
                }

                t.saveRange();

                var options = {
                    url: {
                        label: 'URL',
                        required: true,
                        value: url,
                        pattern: /^(http(s?):\/\/|\/|mailto:)/,
                        patternError: "Invalid URL format",
                        attributes: { placeholder: "eg: /page or https://a.edu/page or mailto:a@b" }
                    },
                    text: {
                        label: t.lang.text,
                        value: text
                    },
                }

                t.openModalInsert(t.lang.createLink, options, function (v) { // v is value
                    // Make escholarship.org links root-relative
                    var url = v.url.replace(/http(s?):\/\/[^/]*escholarship.org/, '')
                    if (!url.length) {
                        return false;
                    }

                    var link = $(['<a href="', url, '">', v.text || v.url, '</a>'].join(''));
                    t.range.deleteContents();
                    t.range.insertNode(link[0]);
                    t.syncCode();
                    t.$c.trigger('tbwchange');
                    return true;
                });
            }
        }
    }

    $.extend(true, $.trumbowyg, {
        // Add some translations
        langs: {
            en: {
                fancyCreateLink: 'Fancy Create Link'
            }
        },
        // Register plugin in Trumbowyg
        plugins: {
            fancyCreateLink: {
                // Code called by Trumbowyg core to register the plugin
                init: function (trumbowyg) {
                    // Fill current Trumbowyg instance with the plugin default options
                    trumbowyg.o.plugins.fancyCreateLink = $.extend(true, {},
                        defaultOptions,
                        trumbowyg.o.plugins.fancyCreateLink || {}
                    );

                    // If the plugin is a button
                    trumbowyg.addBtnDef('fancyCreateLink', buildButtonDef(trumbowyg));
                },
                // Return a list of button names which are active on current element
                tagHandler: function (element, trumbowyg) {
                    return [];
                },
                destroy: function (trumbowyg) {
                }
            }
        }
    })
})(jQuery);