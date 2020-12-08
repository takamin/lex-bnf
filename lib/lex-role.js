"use strict";

/**
 * A role of lexical element.
 * @private
 * @class
 */
class LexRole {
    /**
     * @constructor
     * @param {string} id a role
     */
    constructor(id) {
        /**
         * role id
         * @type {string}
         */
        this.id = id;
    }
}
/**
 * A literal token specifier
 * @type {LexRole}
 */
LexRole.lit = new LexRole("lit");
/**
 * A lexical token specifier
 * @type {LexRole}
 */
LexRole.lex = new LexRole("lex");

module.exports = LexRole;
