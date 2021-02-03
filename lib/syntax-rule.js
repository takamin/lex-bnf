"use strict";
const LexElement = require("./lex-element.js");
/**
 * Rule for a language syntax.
 * @class
 */
class SyntaxRule {
    /**
     * @constructor
     * @typedef {Array<string|LexElement>} Rule
     * @typedef {function(Term):any} Evaluator
     * @param {string} name syntax name
     * @param {Rule[]} rules syntax rules
     * @param {Evaluator|null} evaluator evaluator function
     */
    constructor(name, rules, evaluator) {
        for(const elements of rules) {
            for(const element of elements) {
                if(typeof element !== "string" && !(element instanceof LexElement)) {
                    throw new Error("Type of elements in syntax rules should be string or LexElement");
                }
            }
        }
        /**
         * Rule name.
         * @type {string}
         */
        this.name = name;
        /**
         * Rules to represent this rule.
         * @type {Rule[]}
         */
        this.rules = rules;
        /**
         * A function to evaluate the result of parsing.
         * @type {Evaluator}
         */
        this.evaluator = evaluator;
    }
}
module.exports = SyntaxRule;
