"use strict";
const assert = require("chai").assert;
const SyntaxRule = require("../lib/syntax-rule.js");
describe("SyntaxRule", ()=>{
    describe("constructor", ()=>{
        it("should throw if the type of element of the rules are illegal", ()=>{
            assert.throw(()=>(new SyntaxRule("should be thrown", [[1]])));
        });
        it("should throw if the rule is empty", ()=>{
            assert.throw(()=>(new SyntaxRule("should be thrown", [])));
        });
        it("should throw if the element of rule is empty", ()=>{
            assert.throw(()=>(new SyntaxRule("should be thrown", [[]])));
            assert.throw(()=>(new SyntaxRule("should be thrown", [["a"],[]])));
        });
        it("should throw if it configures left-recursion", ()=>{
            assert.throw(()=>(new SyntaxRule("left-recursion", [
                ["left-recursion"]])));
            assert.throw(()=>(new SyntaxRule("left-recursion", [
                ["a"],["left-recursion"]])));
            assert.throw(()=>(new SyntaxRule("left-recursion", [
                ["a"],["left-recursion", "a"]])));
        });
    });
});