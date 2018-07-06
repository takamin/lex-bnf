"use strict";
/**
 * Token class.
 * @constructor
 */
function Token() {
    this._charbuf = [];
    this._term = "";
    this._type = null;
    this._lineNumber = 0;
    this._col = 0;
}

/**
 * A getter for the term.
 * @returns {string} a term.
 */
Token.prototype.getTerm = function() {
    return this._term;
};

/**
 * A setter for the term.
 * @param {string} term a term to be set.
 * @returns {undefined}
 */
Token.prototype.setTerm = function(term) {
    this._term = term;
    this._charbuf = [];
};

/**
 * Set the token position.
 * @param {number} lineNumber A line number.
 * @param {number} col A column position.
 * @returns {undefined}
 */
Token.prototype.setPos = function(lineNumber, col) {
    this._lineNumber = lineNumber;
    this._col = col;
};

/**
 * Get a line number of this token.
 * @returns {number} A line number.
 */
Token.prototype.getLineNumber = function() {
    return this._lineNumber;
};

/**
 * Get a column position of this token.
 * @returns {number} A line number.
 */
Token.prototype.getColumn = function() {
    return this._col;
};

/**
 * A setter for this type.
 * @param {string} type A type name of this token.
 * @returns {undefined}
 */
Token.prototype.setType = function(type) {
    this._type = type;
};

/**
 * A getter for this type.
 * @returns {string} A type name of this token.
 */
Token.prototype.getType = function() {
    return this._type;
};

/**
 * Push a character to unfixed term buffer.
 * @param {string} c A character.
 * @returns {undefined}
 */
Token.prototype.pushChar  = function(c) {
    this._charbuf.push(c);
};

/**
 * Fix a term buffer.
 * @returns {undefined}
 */
Token.prototype.fixTerm = function() {
    this._term = this._charbuf.join('');
    this._charbuf = [];
};

/**
 * Test if this term is a kind of white-spaces.
 * @returns {boolean} The test result.
 */
Token.prototype.isWhiteSpace = function() {
    var t = this.getType();
    return t === "WS" || t === "WS-LINCMT" || t === "WS-BLKCMT";
};

module.exports = Token;
