"use strict";
const Token = require("./token.js");

/**
 * Lexical essentially tokenizer.
 * @constructor
 */
function LexAnalyzer() {
    this._mode = "";
    this._tokenList = [];
    this._token = null;
    this._source = "";
    this._lineNum = 1;
    this._columnPos = 1;
    this._i = 0;
    this._c = null;
}

/**
 * Parse lexical tokesn.
 * @param {string} source The source text to be parse.
 * @returns {Array<Token>} The result of parsing.
 */
LexAnalyzer.parse = function(source) {
    let tokenizer = new LexAnalyzer();
    return tokenizer.parse(source);
};

/**
 * Test if the character is a kind of white-spaces.
 * @param {string} c a character.
 * @returns {boolean} the test result.
 */
LexAnalyzer.isWhite = function(c) {
    return c.match(/^\s/);
};

/**
 * Test if the character is a kind of punctuaters.
 * @param {string} c a character.
 * @returns {boolean} the test result.
 */
LexAnalyzer.isPunct = function(c) {
    return c.match(/^[!"#$%&'()-=^~\\|@[{;+:*\]},<.>/?_]/);
};

/**
 * Test if the character is a kind of alphabet.
 * @param {string} c a character.
 * @returns {boolean} the test result.
 */
LexAnalyzer.isAlpha = function(c) {
    return c.match(/^[_a-z]/i);
};

/**
 * Test if the character is a kind of alphabet or number.
 * @param {string} c a character.
 * @returns {boolean} the test result.
 */
LexAnalyzer.isAlnum = function(c) {
    return c.match(/^[_a-z0-9]/i);
};

/**
 * Test if the character is a kind of digits.
 * @param {string} c a character.
 * @returns {boolean} the test result.
 */
LexAnalyzer.isDigit = function(c) {
    return c.match(/^[0-9]/);
};

/**
 * Parse lexical tokesn.
 * @param {string} source The source text to be parse.
 * @returns {Array<Token>} The result of parsing.
 */
LexAnalyzer.prototype.parse = function(source) {
    this._mode = "";
    this._tokenList = [];
    this._token = null;
    this._lineNum = 1;
    this._columnPos = 1;
    this._i = 0;
    this._c = null;
    this._source = source;
    while(this._i < this._source.length) {
        this._c = this._source.charAt(this._i);
        switch(this._mode) {
            case "":
                this.parseDefault();
                break;
            case "WS":
                this.parseWhiteSpace();
                break;
            case "IDENT":
                this.parseIdentifier();
                break;
            case "NUMLIT":
                this.parseNumberLiteral();
                break;
        }
        ++this._i;
        ++this._columnPos;
    }
    if(this._token != null) {
        this.finishToken();
    }
    return this._tokenList;
};

/**
 * Parse in initial state.
 * @returns {undefined}
 */
LexAnalyzer.prototype.parseDefault = function() {
    this._token = new Token();
    this._token.setPos(this._lineNum, this._columnPos);
    if(LexAnalyzer.isWhite(this._c)) {
        this._token.pushChar(this._c);
        this._mode = "WS";
    } else if(LexAnalyzer.isAlpha(this._c)) {
        this._token.pushChar(this._c);
        this._mode = "IDENT";
    } else if(LexAnalyzer.isDigit(this._c)) {
        this._token.pushChar(this._c);
        this._mode = "NUMLIT";
    } else if(LexAnalyzer.isPunct(this._c)) {
        this._token.pushChar(this._c);
        this.finishToken("PUNCT");
    }
};

/**
 * Parse white-spaces.
 * @returns {undefined}
 */
LexAnalyzer.prototype.parseWhiteSpace = function() {
    if(LexAnalyzer.isWhite(this._c)) {
        this._token.pushChar(this._c);
        if(this._c == "\n") {
            this._columnPos = 0;
            this._lineNum++;
        }
    } else {
        this.finishToken();
        this.ungetChar();
    }
};

/**
 * Parse an identifier.
 * @returns {undefined}
 */
LexAnalyzer.prototype.parseIdentifier = function() {
    if(LexAnalyzer.isAlnum(this._c)) {
        this._token.pushChar(this._c);
    } else {
        this.finishToken();
        this.ungetChar();
    }
};

/**
 * Parse a number literal.
 * @returns {undefined}
 */
LexAnalyzer.prototype.parseNumberLiteral = function() {
    if(this._c.match(/^[0-9a-z]$/i)) {
        this._token.pushChar(this._c);
    } else {
        this.finishToken();
        this.ungetChar();
    }
};

/**
 * Finish the token parsing.
 * @param {string} mode A mode name to be set to the token finally.
 * If this parameter is null, the tokenizer's currently mode is used.
 * @returns {undefined}
 */
LexAnalyzer.prototype.finishToken = function(mode) {
    this._token.setType(mode || this._mode);
    this._token.fixTerm();
    this._tokenList.push(this._token);
    this._token = null;
    this._mode = "";
};

/**
 * Push back the parsing char.
 * @returns {undefined}
 */
LexAnalyzer.prototype.ungetChar = function() {
    --this._i;
    --this._columnPos;
};

module.exports = LexAnalyzer;
