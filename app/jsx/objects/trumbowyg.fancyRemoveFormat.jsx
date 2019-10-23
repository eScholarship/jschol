/* ===========================================================
 * trumbowyg.fancyRemoveFormat.js
 * Fancier removeFormat plugin for Trumbowyg
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
            ico: 'removeformat',
            fn: function () {
                var t = trumbowyg,
                    documentSelection = t.doc.getSelection(),
                    selectedRange = documentSelection.getRangeAt(0),
                    text = ($('<div>').append(selectedRange.cloneContents()).text()) || (selectedRange + '');
                selectedRange.deleteContents()
                selectedRange.insertNode(document.createTextNode(text));
                t.syncCode();
                t.$c.trigger('tbwchange');
                return true;
            }
        }
    }

    $.extend(true, $.trumbowyg, {
        // Add some translations
        langs: {
            en: {
                fancyRemoveFormat: 'Fancy Remove Format'
            }
        },
        // Register plugin in Trumbowyg
        plugins: {
            fancyRemoveFormat: {
                // Code called by Trumbowyg core to register the plugin
                init: function (trumbowyg) {
                    // Fill current Trumbowyg instance with the plugin default options
                    trumbowyg.o.plugins.fancyRemoveFormat = $.extend(true, {},
                        defaultOptions,
                        trumbowyg.o.plugins.fancyRemoveFormat || {}
                    );

                    // If the plugin is a button
                    trumbowyg.addBtnDef('fancyRemoveFormat', buildButtonDef(trumbowyg));
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