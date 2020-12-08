"use strict";
const assert = require("chai").assert;
const Token = require("../lib/token.js");
describe("Token", ()=>{
    describe("#getLineNumber", ()=>{
        it("should return valid line number", ()=>{
            const token = new Token();
            token.setPos(123, 456);
            assert.equal(token.getLineNumber(), 123);
        });
    });
    describe("#getColumn", ()=>{
        it("should return valid column number", ()=>{
            const token = new Token();
            token.setPos(123, 456);
            assert.equal(token.getColumn(), 456);
        });
    });
});
