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
