"use strict";
const debug = require("debug")("BnfResult");

/**
 * BNF parsing result object.
 * @constructor
 */
function BnfResult() {
    this._syntaxError = false;
    this.terms = [];
    this.lexCount = 0;
}

BnfResult.prototype.existsTerm = function(name) {
    let term = this.getTerm(name);
    if(term !== false) {
        return term.match;
    }
    return false;
};

BnfResult.prototype.getTerm = function(name) {
    let n = this.terms.length;
    for(let i = 0; i < n; i++) {
        if(this.terms[i].term === name) {
            return this.terms[i];
        }
    }
    return false;
};

BnfResult.prototype.getWordsList = function(termName, indent) {
    termName = termName || "*";
    indent = indent || 0;
    let words = [];
    this.terms.forEach(function(term) {
        if(term.match) {
            if(termName === "*" || term.term === termName) {
                let subWords = term.getTermsList();
                words.push(subWords);
            } else {
                let subWords = term.getWordsList(termName, indent + 1);
                subWords.forEach((subWord)=>{
                    words.push(subWord);
                });
            }
        }
    });
    return words;
};

BnfResult.prototype.getTermsList = function(indent) {
    indent = indent || 0;
    let s = [];
    this.terms.forEach(function(term) {
        if(term.terms.length == 0) {
            if(term.lex) {
                s.push(term.lex.getTerm());
            }
        } else {
            term.getTermsList(indent+1).forEach(function(term) {
                s.push(term);
            });
        }
    });
    return s;
};

/**
 * Search parsed language elements having specified name.
 * @param {string} name definition name to search
 * @returns {Array<BnfResult>} found elements
 * @deprecated Use BnfResult#enumerate(name)
 */
BnfResult.prototype.getTermListOf = function(name) {
    debug(`BnfResult.getTermListOf(${name})`);
    debug(`this: ${this.toString()}`);
    const list = [];
    this.enumerate(name, result => list.push(result));
    debug(`BnfResult.getTermListOf returns:`);
    debug(`${list.map(e=>e.toString()).join("\n")}`);
    return list;
};

/**
 * Enumerate parsed language elements having specified name.
 * @param {string} name definition name to search
 * @param {Function} callback function that takes one parameter which is
 *  instance of BnfResult enumerated.
 * @returns {undefined}
 */
BnfResult.prototype.enumerate = function(name, callback) {
    debug(`BnfResult.enumerate(${name})`);
    debug(`this: ${this.toString()}`);
    const enumerate = result => {
        if(result.term === name) {
            debug(`BnfResult.enumerate callback ${result.toString()}`);
            callback(result);
        } else {
            result.terms.forEach(term => enumerate(term));
        }
    };
    enumerate(this);
};

/**
 * Bind descendent terms to one token.
 * @param {string} type A type name for the result token.
 * @returns {Token} The result token.
 */
BnfResult.prototype.buildWord = function(type) {
    let lex = null;
    let s = [];
    this.terms.forEach( term => {
        let subLex = null;
        if(term.lex != null) {
            subLex = term.lex;
        } else {
            subLex = term.buildWord( type );
        }
        if(subLex != null) {
            if(lex == null) {
                lex = subLex;
            }
            s.push(subLex.getTerm());
        }
    });
    if(lex != null) {
        lex.setType(type);
        lex.setTerm(s.join(""));
    }
    return lex;
};

/**
 * Get token list that the type name of all terms is rewritten by the rule of
 * specified parameters.
 * @param {Array<string>} termsOfWord The type names that should be rewrited.
 * @param {object} linkedWordTokenTypeMap The new type names pointed by old name.
 * @returns {Array<Token>} The list of tokens that the type was replaced
 */
BnfResult.prototype.rebuildWords = function(
        termsOfWord, linkedWordTokenTypeMap)
{
    let lexList = [];
    this.terms.forEach( childTerm => {
        if(childTerm.match) {
            let term = childTerm.term;
            if(typeof(term) === "string"
                && termsOfWord.indexOf(term) >= 0)
            {
                let lexType = linkedWordTokenTypeMap[term];
                let lex = childTerm.buildWord(lexType);
                lexList.push(lex);
            } else {
                let childLex = childTerm.lex;
                if(childLex != null) {
                    lexList.push(childLex);
                }
                childTerm.rebuildWords(
                    termsOfWord, linkedWordTokenTypeMap
                ).forEach( lex => { lexList.push(lex); });
            }
        }
    });
    return lexList;
};

/**
 * Stringify this object.
 * @returns {string} representing the content recursively.
 */
BnfResult.prototype.toString = function() {
    const _toString = (result, i) => {
        const indent = " ".repeat(i*4);
        if(!Array.isArray(result.terms) || result.terms.length == 0) {
            const lex = result.lex;
            if(lex == null) {
                return `${indent}! lex is null`;
            } else {
                return `${indent}- (${lex._lineNumber},${lex._col}) : ${JSON.stringify(lex._term)} : ${lex._type}`;
            }
        } else {
            return `${indent}+ [${result.term}]\n${result.terms.map( term => _toString(term, i+1) ).join("\n")}`;
        }
    };
    return _toString(this, 0);
};

module.exports = BnfResult;
