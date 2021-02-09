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
 * @private
 * @return {string} a term.
 */
Token.prototype.getTerm = function() {
    return this._term;
};

/**
 * A setter for the term.
 * @private
 * @param {string} term a term to be set.
 * @return {undefined}
 */
Token.prototype.setTerm = function(term) {
    this._term = term;
    this._charbuf = [];
};

/**
 * Set the token position.
 * @private
 * @param {number} lineNumber A line number.
 * @param {number} col A column position.
 * @return {undefined}
 */
Token.prototype.setPos = function(lineNumber, col) {
    this._lineNumber = lineNumber;
    this._col = col;
};

/**
 * Get a line number of this token.
 * @return {number} A line number.
 */
Token.prototype.getLineNumber = function() {
    return this._lineNumber;
};

/**
 * Get a column position of this token.
 * @return {number} A line number.
 */
Token.prototype.getColumn = function() {
    return this._col;
};

/**
 * A setter for this type.
 * @private
 * @param {string} type A type name of this token.
 * @return {undefined}
 */
Token.prototype.setType = function(type) {
    this._type = type;
};

/**
 * A getter for this type.
 * @return {string} A type name of this token.
 */
Token.prototype.getType = function() {
    return this._type;
};

/**
 * Push a character to unfixed term buffer.
 * @private
 * @param {string} c A character.
 * @return {undefined}
 */
Token.prototype.pushChar = function(c) {
    this._charbuf.push(c);
};

/**
 * Fix a term buffer.
 * @private
 * @return {undefined}
 */
Token.prototype.fixTerm = function() {
    this._term = this._charbuf.join("");
    this._charbuf = [];
};

/**
 * Test if this term is a kind of white-spaces.
 * @return {boolean} The test result.
 */
Token.prototype.isWhiteSpace = function() {
    const t = this.getType();
    return t === "WS" || t === "WS-LINCMT" || t === "WS-BLKCMT";
};

module.exports = Token;
