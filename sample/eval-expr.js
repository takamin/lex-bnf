"use strict";
const calc = require("./calc.js");
const expr = process.argv[2];
const result = calc.parse(expr);
if(result.error) {
    console.error(
        `Syntax error: stopped at ${JSON.stringify(result.errorToken)}`);
} else {
    try {
        const value = calc.evaluate(result);
        console.log(`${value}`);
    } catch(err) {
        console.error(`Evaluation error: ${err.message}`);
    }
}
