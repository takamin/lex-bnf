"use strict";
const Language = require("../lib/language.js");
const {syntax, literal: lit, numlit} = Language;

// Defines syntax of language by BNF-like definition and evaluator.
const calc = new Language([
    syntax("calc", [["expression"]]),

    syntax("expression", [["additive-expression"]]),

    syntax("additive-expression",
        [
            // A declaration of term repeating should be declared as recursively and placed
            // at the end of the rule.
            ["multiplicative-expression", lit("+"), "additive-expression"],
            ["multiplicative-expression", lit("-"), "additive-expression"],
            ["multiplicative-expression"],
        ],
        /**
         * evaluate 'additive-expression'
         * @param {Term} term result of parsing 'additive-expression'
         */
        (term) => {
            // get no whitespace tokens
            const terms = term.contents();
            const [a, ope, b] = terms;
            return !ope ? a : {
                "+": a + b,
                "-": a - b,
            }[ope];
        }),

    syntax("multiplicative-expression",
        [
            ["unary-expression", lit("*"), "multiplicative-expression"],
            ["unary-expression", lit("/"), "multiplicative-expression"],
            ["unary-expression"],
        ],
        (term) => {
            const terms = term.contents();
            const [a, ope, b] = terms;
            return !ope ? a : {
                "*": a * b,
                "/": a / b,
            }[ope];
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
            // NOTE: There is no optional term, so all patterns should be declared.
            // With using the optional term, the declarations above is able to be replaced by:
            //
            //      floating-constant ::= floating-real-part opt("e") opt(integer-constant)
        ],
        (term) => {
            // Get a token representing this element
            const s = term.str();
            // With the BNF rule above, the string could include white spaces.
            // If the string includes white spaces, this method throws an error.
            // The error will be returned from `Language#evaluate()`.
            if(/\s/.test(s)) {
                throw new Error(`invalid text for floating-constant`);
            }
            return parseFloat(s);
        }),
    syntax("floating-real-part",
        [
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
