"use strict";
const Language = require("../lib/language.js");
const {syntax, literal: lit, numlit} = Language;

// Defines syntax of language by BNF-like definition and evaluator.
const calc = new Language([
    syntax("calc", [["expression"]]),

    // The evaluator is omittable when the rules contains only one
    // term such as  `additive-expression` below.
    syntax("expression", [["additive-expression"]]),

    syntax("additive-expression",
        [
            // The trailing `*` is a repetition specifier.
            // It can avoid an infinite recursion leading from
            // left-recursion.
            ["multiplicative-expression", "additive-expression-rest*"],
        ],
        /**
         * evaluate 'additive-expression'
         * @param {Term} term result of parsing 'additive-expression'
         * @return {number} A result of the calculation.
         */
        (term) => {
            // get no whitespace tokens
            const terms = [].concat(...term.contents());
            let acc = terms[0];
            for(let i = 1; i < terms.length; i += 2) {
                const ope = terms[i];
                const value = terms[i + 1];
                switch(ope) {
                case "+": acc += value; break;
                case "-": acc -= value; break;
                }
            }
            return acc;
        }),

    syntax("additive-expression-rest",
        [
            [lit("+"), "multiplicative-expression"],
            [lit("-"), "multiplicative-expression"],
        ],
        (term) => {
            return term.contents();
        }),

    syntax("multiplicative-expression",
        [
            ["unary-expression", "multiplicative-expression-rest*"],
        ],
        (term) => {
            const terms = [].concat(...term.contents());
            let acc = terms[0];
            for(let i = 1; i < terms.length; i += 2) {
                const ope = terms[i];
                const value = terms[i + 1];
                switch(ope) {
                case "*": acc *= value; break;
                case "/": acc /= value; break;
                }
            }
            return acc;
        }),

    syntax("multiplicative-expression-rest",
        [
            [lit("*"), "unary-expression"],
            [lit("/"), "unary-expression"],
        ],
        (term) => {
            return term.contents();
        }),

    syntax("unary-expression", [["postfix-expression"]]),

    syntax("postfix-expression", [["primary-expression"]]),

    syntax("primary-expression", [
        ["literal"],
        [lit("("), "expression", lit(")")],
    ],
    (term) => {
        const terms = term.contents();
        return (terms[0] !== "(" ? terms[0] : terms[1]);
    }),

    syntax("literal",
        [
            ["floating-constant"],
            ["integer-constant"],
        ]),

    syntax("floating-constant",
        [
            ["floating-real-part", lit("e"), "integer-constant"],
            ["floating-real-part"],
        ],
        (term) => {
            // Get a token representing this element
            const s = term.str();
            // With the BNF rule above, the string could include white spaces.
            // If the string includes white spaces, this method throws an error.
            // The error will be returned from `Language#evaluate()`.
            if(/\s/.test(s)) {
                throw new Error("invalid text for floating-constant");
            }
            return parseFloat(s);
        }),
    syntax("floating-real-part",
        [
            // The optional term is not offerd, so all patterns should be declared.
            [numlit, lit("."), numlit],
            [numlit, lit(".")],
            [lit("."), numlit],
            ["sign", numlit, lit("."), numlit],
            ["sign", numlit, lit(".")],
            ["sign", lit("."), numlit],
        ],
        (term) => term.str()),
    syntax("integer-constant",
        [
            [numlit],
            ["sign", numlit],
        ],
        (term) => {
            return parseInt(term.str());
        }),
    syntax("sign",
        [
            [lit("+")],
            [lit("-")],
        ],
        (term) => term.str()),
]);

module.exports = calc;
