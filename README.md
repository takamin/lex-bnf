Lex-BNF
=======

This is a **general-purpose recursive descent parser and evaluator**.

Using exported class `Language`, You can:

1. Defines a syntax rule such as programming languages, expressions, or structured statements.
1. Parses the code written based on the rules.
1. Evaluate the result of the parsing.

__NOTE: The deprecated class `BNF` which is the old implementation is offered as `Language.BNF`.__

Demonstration
-------------

### Evalutes arithmetic expression

A simple example to evaluate an arithmetic expression from CLI.

```bash
$ node sample/eval-expr.js '(1 + 2) * ((3 + 4) / 2)'
10.5
$
```

#### __`sample/eval-expr.js`__

```javascript
"use strict";
const calc = require("./calc.js");
const expr = process.argv.slice(2).join("");
if(!expr) {
    console.error("Error: no expression to evaluate");
    console.error("eval-expr '<expression>'");
}
try {
    const result = calc.parse(expr);
    if(result.error) {
        const {_term: term, _lineNumber: line, _col: column} = result.errorToken;
        console.error(`Syntax error: stopped at ${JSON.stringify(term)} (${line}, ${column})`);
    } else {
        const value = calc.evaluate(result);
        if(value instanceof Error) {
            console.error(`Evaluation error: ${value.message}`);
        } else {
            console.log(`${value}`);
        }
    }
} catch(err) {
    console.error(`Parser Error: stopped at ${err.stack}`);
}
```

#### __`sample/calc.js`__

BNF-like definition and evaluators for each terms.

```javascript
"use strict";
const Language = require("lex-bnf");
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
```

LICENSE
-------

This software is released under the MIT License, see [LICENSE](LICENSE)
