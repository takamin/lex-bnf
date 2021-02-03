"use strict";
const debug = require("debug")("BnfResult");
// eslint-disable-next-line no-unused-vars
const LexElement = require("./lex-element.js");

/**
 * BNF parsing result object.
 * @deprecated
 * @constructor
 */
function BnfResult() {
    this._error = false;
    this.terms = [];
    this.lexCount = 0;
    this.match = false;
    this.lex = null;
    this.optional = false;
    this.term = null;
    this.types = [];
}

/**
 * @return {BnfResult} result
 */
BnfResult.forTermList = () => {
    const result = new BnfResult();
    result.match = true;
    return result;
};
/**
 * @param {string|LexElement} term a term
 * @return {BnfResult} result
 */
BnfResult.forTerm = (term) => {
    const result = new BnfResult();
    if(typeof term === "string") {
        result.optional = (term.match(/^\[.*\]$/) ? true : false);
        term = term.replace(/^\[(.*)\]$/, "$1");
    }
    result.term = term;
    return result;
};
/**
 * @param {BnfResult} termsResult a result of parsing.
 * @return {undefined}
 */
BnfResult.prototype.setTermListResult = function(termsResult) {
    if(termsResult._error) {
        this.match = termsResult.match;
        this.lexCount += termsResult.lexCount;
        this._error = termsResult._error;
    } else if(termsResult.match) {
        this.match = termsResult.match;
        this.lexCount += termsResult.lexCount;
        this.terms = termsResult.terms;
    }
};
/**
 * @param {BnfResult} sentenceResult a result of parsing.
 * @return {undefined}
 */
BnfResult.prototype.setSentenceResult = function(sentenceResult) {
    this.match = sentenceResult.match;
    this._error = sentenceResult._error;
    this.terms = sentenceResult.terms;
};
/**
 * @param {BnfResult} termResult a result of a term.
 * @return {undefined}
 */
BnfResult.prototype.pushTermResult = function(termResult) {
    this.terms.push(termResult);
    if(termResult._error) {
        this.match = false;
        this.terms = [];
        this.lexCount = 0;
        this._error = termResult._error;
    } else if(!termResult.optional && !termResult.match) {
        this.match = false;
        this.terms = [];
        this.lexCount = 0;
        this._error = termResult._error;
    }
};
/**
 * @param {Token} token A token
 * @param {LexElement} lexElement A lexical element
 * @return {undefined}
 */
BnfResult.prototype.setLexForTerm = function(token, lexElement) {
    this.lex = token;
    this.term = lexElement;
    this.match = lexElement.isMatch(token);
};
BnfResult.prototype.existsTerm = function(name) {
    const term = this.getTerm(name);
    if(term !== false) {
        return term.match;
    }
    return false;
};

BnfResult.prototype.getTerm = function(name) {
    const n = this.terms.length;
    for(let i = 0; i < n; i++) {
        if(this.terms[i].term === name) {
            return this.terms[i];
        }
    }
    return false;
};

BnfResult.prototype.getWordsList = function(termName) {
    termName = termName || "*";
    const words = [];
    this.terms.forEach(function(term) {
        if(term.match) {
            if(termName === "*" || term.term === termName) {
                const subWords = term.getTermsList();
                words.push(subWords);
            } else {
                const subWords = term.getWordsList(termName);
                subWords.forEach((subWord)=>{
                    words.push(subWord);
                });
            }
        }
    });
    return words;
};

BnfResult.prototype.getTermsList = function() {
    const s = [];
    this.terms.forEach(function(term) {
        if(term.terms.length == 0) {
            if(term.lex) {
                s.push(term.lex.getTerm());
            }
        } else {
            term.getTermsList().forEach(function(term) {
                s.push(term);
            });
        }
    });
    return s;
};

/**
 * Search parsed language elements having specified name.
 * @param {string} name definition name to search
 * @return {Array<BnfResult>} found elements
 * @deprecated Use BnfResult#enumerate(name)
 */
BnfResult.prototype.getTermListOf = function(name) {
    debug(`BnfResult.getTermListOf(${name})`);
    debug(`this: ${this.toString()}`);
    const list = [];
    this.enumerate(name, (result) => list.push(result));
    debug("BnfResult.getTermListOf returns:");
    debug(`${list.map((e)=>e.toString()).join("\n")}`);
    return list;
};

/**
 * Enumerate parsed language elements having specified name.
 * @param {string} name definition name to search
 * @param {Function} callback function that takes one parameter which is
 *  instance of BnfResult enumerated.
 * @return {undefined}
 */
BnfResult.prototype.enumerate = function(name, callback) {
    debug(`BnfResult.enumerate(${name})`);
    debug(`this: ${this.toString()}`);
    const enumerate = (result) => {
        if(result.term === name) {
            debug(`BnfResult.enumerate callback ${result.toString()}`);
            callback(result);
        } else {
            result.terms.forEach((term) => enumerate(term));
        }
    };
    enumerate(this);
};

/**
 * Bind descendent terms to one token.
 * @param {string} type A type name for the result token.
 * @return {Token} The result token.
 */
BnfResult.prototype.buildWord = function(type) {
    let lex = null;
    const s = [];
    this.terms.forEach( (term) => {
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
 * @return {Array<Token>} The list of tokens that the type was replaced
 */
BnfResult.prototype.rebuildWords = function(
    termsOfWord, linkedWordTokenTypeMap) {
    const lexList = [];
    this.terms.forEach( (childTerm) => {
        if(childTerm.match) {
            const term = childTerm.term;
            if(typeof(term) === "string" &&
                termsOfWord.indexOf(term) >= 0) {
                const lexType = linkedWordTokenTypeMap[term];
                const lex = childTerm.buildWord(lexType);
                lexList.push(lex);
            } else {
                const childLex = childTerm.lex;
                if(childLex != null) {
                    lexList.push(childLex);
                }
                childTerm.rebuildWords(
                    termsOfWord, linkedWordTokenTypeMap,
                ).forEach( (lex) => {
                    lexList.push(lex);
                });
            }
        }
    });
    return lexList;
};

/**
 * Stringify this object.
 * @return {string} representing the content recursively.
 */
BnfResult.prototype.toString = function() {
    const _toString = (result, i) => {
        const indent = " ".repeat(i*4);
        const syntaxName = result.getSyntaxName();
        const syntaxContent = result.getSyntaxContent();
        if(Array.isArray(syntaxContent)) {
            return `${indent}+ [${syntaxName}]\n${
                syntaxContent.map( (term) => _toString(term, i+1) ).join("\n")}`;
        }
        const err = result._error ? "E" : "";
        const match = result.match ? "" : "!";
        const token = result.lex ? result.lex : null;
        if(token == null) {
            return `${err}${match}${indent}! token is null`;
        }
        return `${err}${match}${indent}- (${
            token._lineNumber},${token._col}) : ${
            JSON.stringify(syntaxContent)} : ${syntaxName}`;
    };
    return _toString(this, 0);
};

BnfResult.prototype.getSyntaxName = function() {
    if(typeof this.term === "string") {
        return this.term;
    }
    const token = this.lex ? this.lex : null;
    if(token == null) {
        return null;
    } else {
        return token._type;
    }
};
BnfResult.prototype.getSyntaxContent = function() {
    if(!Array.isArray(this.terms) || this.terms.length == 0) {
        const token = this.lex ? this.lex : null;
        if(token == null) {
            return null;
        } else {
            return token._term;
        }
    } else {
        return this.terms;
    }
};

module.exports = BnfResult;
