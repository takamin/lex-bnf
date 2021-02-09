"use strict";
// eslint-disable-next-line no-unused-vars
const Token = require("./token.js");
const debug = require("debug")("Term");

/**
 * A result of Language#parse()
 * @class
 */
class Term {
    /**
     * This is private constructor.
     * The instance is created from Language#parse().
     * @constructor
     */
    constructor() {
        /**
         * A rule name.
         * @private
         * @type {string}
         */
        this.name = null;
        /**
         * Contains a parsing error after the Language#parse
         * @public
         * @type {Error}
         */
        this.error = null;
        /**
         * A token where the parsing error is detected.
         * @public
         * @type {Token|null}
         */
        this.errorToken = null;
        /**
         * Array of all token in this term that is a result of parsing.
         * If it includes white space tokens, the length is not equal to the
         * count of terms in the syntax rule of the language definition.
         * @public
         * @type {Array<Token|Term>|null}
         */
        this.elements = null;
        /**
         * A function to get an array of effective tokens evaluated by language
         * definition. It does not include white spaces.
         * @public
         * @type {function():Array<string>}
         */
        this.contents = null;
        /**
         * A function to get a string joined with all tokens evaluated by
         * language definition. It might including white space.
         * @public
         * @type {function():string}
         */
        this.str = null;
    }
    /**
     * @private
     * @param {string} name A symbol name
     * @param {{contents:function():string[], str:function():string}} getters
     *  Extra getter methods
     * `{contents:function():string[], str:function():string}`
     * @return {Term}
     */
    static create(name, getters) {
        debug(`create #${this.name}`);
        const term = new Term();
        term.name = name;
        term.error = null;
        term.errorToken = null;
        term.elements = [];
        term.contents = getters.contents;
        term.str = getters.str;
        return term;
    }
    /**
     * @private
     * @return {undefined}
     */
    clear() {
        debug(`#${this.name} clear`);
        this.error = null;
        this.errorToken = null;
        this.elements = [];
    }
    /**
     * @private
     * @param {Error} error An error object
     * @param {Token|null} token A token where the error is detected
     * @return {undefined}
     */
    setError(error, token) {
        debug(`#${this.name} setError`);
        debug(`  error: ${JSON.stringify(error.message)}`);
        debug(`  token: ${JSON.stringify(token)}`);
        this.error = error;
        this.errorToken = token;
        this.elements = [];
    }
    /**
     * @private
     * @param {Token|Term} term term
     * @return {undefined}
     */
    addTerm(term) {
        debug(`#${this.name} addTerm ${JSON.stringify(term)}`);
        this.elements.push(term);
    }
    /**
     * @private
     * @return {string} content description
     */
    toString() {
        const _toString = (term, lines, depth) => {
            const indent = `${".   ".repeat(depth)}`;
            term.elements.forEach((element, i) => {
                if(element instanceof Token) {
                    lines.push(`${indent}[${i}]${
                        JSON.stringify(element.getTerm())}:${term.name}`);
                } else {
                    lines.push(`${indent}[${i}]${
                        element.name}`);
                    _toString(element, lines, depth + 1);
                }
            });
            if(term.error != null) {
                const token = `${JSON.stringify(term.errorToken)}`;
                lines.push(`ERROR at ${token} in term ${term.name}`);
            }
            return lines;
        };
        return _toString(this, [], 0).join("\n");
    }
}
module.exports = Term;
