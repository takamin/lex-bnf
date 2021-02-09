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
        // Check the length of rule
        if(!rules || !Array.isArray(rules) || rules.length == 0) {
            throw new Error(`No rule defined in syntax rule ${name}`);
        }
        for(const elements of rules) {
            // Check the length of rule
            if(!elements || !Array.isArray(elements) || elements.length == 0) {
                throw new Error(`No rule defined in syntax rule ${name}`);
            }
            // Check types
            for(const element of elements) {
                if(typeof element !== "string" && !(element instanceof LexElement)) {
                    throw new Error(`Invalid type of term in syntax rule ${name}`);
                }
            }
            // Check left recursion
            const firstElement = elements[0];
            if(typeof firstElement === "string") {
                if(firstElement === name) {
                    throw new Error(`Left recursion is found in syntax rule ${name}`);
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
