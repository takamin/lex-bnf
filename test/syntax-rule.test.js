"use strict";
const assert = require("chai").assert;
const SyntaxRule = require("../lib/syntax-rule.js");
describe("SyntaxRule", ()=>{
    describe("constructor", ()=>{
        it("should throw if the type of element of the rules are illegal", ()=>{
            assert.throw(()=>(new SyntaxRule("should be thrown", [[1]])));
        });
    });
});