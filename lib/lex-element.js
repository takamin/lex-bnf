"use strict";
const LexRole = require("./lex-role.js");
const debug = require("debug")("LexElement");
/**
 * @private
 * @class
 */
class LexElement {
    /**
     * @constructor
     * @param {LexRole} role A role of the lexical element
     * @param {string} value lexical value.
     * @param {boolean} inverse inverse the conditional expression for the lexical analyzing.
     */
    constructor(role, value, inverse) {
        if(!(role instanceof LexRole)) {
            throw new Error(`The role should be an instance of LexRole`);
        }
        if(typeof value !== "string") {
            throw new Error(`The type of value should be string`);
        }
        inverse = inverse == null ? true: inverse;
        if(typeof inverse !== "boolean") {
            throw new Error(`The type of inverse should be boolean`);
        }
        this.role = role.id;
        this.value = value;
        this.inverse = inverse;
    }
    /**
     * Test the token matches to this.
     * @param {Token} token A token to be tested.
     * @returns {boolean} the token matches or not.
     */
    isMatch(token) {
        const value = this.getTokenValue(token);
        debug(`LexElement#isMatch(${JSON.stringify(token)}) <=> ${value}`);
        return this.value.toUpperCase() === value.toUpperCase();
    }
    /**
     * Get the value of token.
     * @param {Token} token A token to be tested.
     * @returns {string|null} the token value.
     */
    getTokenValue(token) {
        if(this.role === LexRole.lit.id) {
            return token.getTerm();
        } else if(this.role === LexRole.lex.id) {
            return token.getType();
        }
        throw new Error(`Unknown role id ${this.role}`);
    }
}

module.exports = LexElement;
