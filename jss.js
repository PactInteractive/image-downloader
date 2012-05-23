/*
 * JSS v0.3 - JavaScript Stylesheets
 * https://github.com/Box9/jss
 *
 * Copyright (c) 2011, David Tang
 * MIT Licensed (http://www.opensource.org/licenses/mit-license.php)
 */

var jss = (function (undefined) {
    var jss,
        Jss,
        // Shortcuts
        doc = document,
        head = doc.head || doc.getElementsByTagName('head')[0],
        sheets = doc.styleSheets;
    
    jss = function (selector, sheet) {
        var obj = new Jss();
        obj.init(selector, sheet);
        return obj;
    };
    
    
    // Core functions for manipulating stylesheets
    
    jss._sheetToNode = function (sheet) {
        return sheet.ownerNode || sheet.owningElement;
    };
    
    jss._nodeToSheet = function (node) {
        var result = null,
            i;
        
        for (i = 0; i < sheets.length; i++) {
            if (node === jss._sheetToNode(sheets[i])) {
                result = sheets[i];
                break;
            }
        }
        
        return result;
    };
    
    jss._getSheets = function (sheetSelector) {
        var results = [],
            node,
            i;
        
        if (!sheetSelector) {
            results = sheets;
        } else if (typeof sheetSelector == 'number') {
            results = [sheets[sheetSelector]];
        } else if (typeof sheetSelector == 'object') {
            if (sheetSelector.href) {
                for (i = 0; i < sheets.length; i++) {
                    node = jss._sheetToNode(sheets[i]);
                    if (sheetSelector.href && node.href == sheetSelector.href ||
                        sheetSelector.title && node.title == sheetSelector.title) {
                        results.push(sheets[i]);
                    }
                }
            }
        }
        
        return results;
    };
    
    jss._addSheet = function () {
        var styleNode = doc.createElement('style'),
            i;
        
        styleNode.type = 'text/css';
        styleNode.rel = 'stylesheet';
        head.appendChild(styleNode);
        
        return jss._nodeToSheet(styleNode);
    };
    
    jss._removeSheet = function (sheet) {
        var node = jss._sheetToNode(sheet);
        node.parentNode.removeChild(node);
    };
    
    jss._getRules = function (sheet, selector) {
        var results = [],
            rules,
            i;

        if (typeof sheet.length == 'number') {
            // Array of sheets
            for (i = 0; i < sheet.length; i++) {
                results = results.concat(jss._getRules(sheet[i], selector));
            }
        } else {
            // Single sheet
            rules = sheet.cssRules || sheet.rules;
            for (i = 0; i < rules.length; i++) {
                // Warning, selectorText may not be correct in IE<9
                // as it splits selectors with ',' into multiple rules.
                // Also, certain rules (e.g. @rules) don't have selectorText
                if (rules[i].selectorText && rules[i].selectorText.toLowerCase() == selector.toLowerCase()) {
                    results.push({
                        sheet: sheet,
                        index: i,
                        style: rules[i].style
                    });
                }
            }
        }

        return results;
    };

    // Add an (empty) rule
    jss._addRule = function (sheet, selector) {
        var rules = sheet.cssRules || sheet.rules,
            index = rules.length;

        if (sheet.insertRule) {
            sheet.insertRule(selector + ' { }', index);
        } else if (sheet.addRule) {
            sheet.addRule(selector, null, index);
        }
        
        return {
            sheet: sheet,
            index: index,
            style: rules[index].style
        };
    };
    
    jss._removeRule = function (rule) {
        var sheet = rule.sheet,
            index = rule.index;

        if (sheet.deleteRule) {
            sheet.deleteRule(index);
        } else if (sheet.removeRule) {
            sheet.removeRule(index);
        }
    };
    
    
    // Object structure for some code candy
    Jss = function () {};

    Jss.prototype = {
        init: function (selector, sheet) {
            var i;

            if (sheet == null) {
                if (!this.sheets) this.sheets = jss._getSheets();
            } else if (sheet === jss) {
                if (jss.dfault === undefined)
                    jss.dfault = jss._addSheet();
                this.sheets = [jss.dfault];
            } else if (typeof sheet == 'number') {
                this.sheets = jss._getSheets(sheet);
            } else if (typeof sheet == 'object') {
                // Recursive call to init
                return this.init(selector, jss).add(sheet);
            }

            this.selector = selector;

            return this;
        },
        add: function (prop, value) {
            var i;

            // Add new rule to every sheet that doesn't already have it
            for (i = 0; i < this.sheets.length; i++) {
                if (jss._getRules(this.sheets[i], this.selector).length == 0) {
                    jss._addRule(this.sheets[i], this.selector);
                }
            }

            this.set(prop, value);

            return this;
        },
        set: function (prop, value) {
            var i,
                rules;

            if (value === undefined) {
                if (prop && typeof prop == 'object') {
                    for (i in prop) {
                        if (!prop.hasOwnProperty(i)) continue;
                        this.set(i, prop[i]);
                    }
                }
            } else {
                rules = jss._getRules(this.sheets, this.selector);
                // Set properties for each rule
                for (i = 0; i < rules.length; i++) {
                    rules[i].style[prop] = value;
                }
            }

            return this;
        },
        get: function (prop) {
            var result,
                rules = jss._getRules(this.sheets, this.selector),
                propName,
                i,
                j;

            if (prop !== undefined) {
                for (i = rules.length - 1; i >=0; i--) {
                    if (rules[i].style[prop] != null) {
                        result = rules[i].style[prop];
                        break;
                    }
                }
            } else {
                result = {};
                for (i = 0; i < rules.length; i++) {
                    for (j = 0; j < rules[i].style.length; j++) {
                        propName = rules[i].style[j];
                        result[propName] = rules[i].style[propName];
                    }
                }
            }

            return result;
        },
        remove: function () {
            var rules = jss._getRules(this.sheets, this.selector),
                i;

            // Remove backwards so indices don't shift
            for (i = rules.length - 1; i >= 0; i--) {
                jss._removeRule(rules[i]);
            }
        }
    };
    
    return jss;
})();
