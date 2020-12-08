"use strict";
const assert = require("chai").assert;
const LexElement = require("../lib/lex-element.js");
const LexRole = require("../lib/lex-role.js");
const Token = require("../lib/token.js");
describe("LexElement", ()=>{
    describe("constructor", ()=>{
        describe("parameter error", ()=>{
            it("should throw, when role is invalid", ()=>{
                assert.throw(()=>{
                    new LexElement({id:"lit"}, "throw", false);
                });
            });
            it("should throw, when value is null", ()=>{
                assert.throw(()=>{
                    new LexElement(LexRole.lit, null, false);
                });
            });
            it("should throw, when value is a number", ()=>{
                assert.throw(()=>{
                    new LexElement(LexRole.lit, 0, false);
                });
            });
            it("should throw, when invers is not a boolean", ()=>{
                assert.throw(()=>{
                    new LexElement(LexRole.lit, "string", "true");
                });
            });
        });
        it("should construct", ()=>{
            assert.doesNotThrow(()=>{
                new LexElement(LexRole.lit, "string", false);
            });
            assert.doesNotThrow(()=>{
                new LexElement(LexRole.lex, "string", true);
            });
            assert.doesNotThrow(()=>{
                new LexElement(LexRole.lex, "string");
            });
        });
        describe("The parameter of inverse could be omitted", ()=>{
            it("should be equivalent to what true is specified", ()=>{
                assert.deepEqual(
                    new LexElement(LexRole.lex, "string"),
                    new LexElement(LexRole.lex, "string", true));
            });
            it("should not be equivalent to what false is specified", ()=>{
                assert.notDeepEqual(
                    new LexElement(LexRole.lex, "string"),
                    new LexElement(LexRole.lex, "string", false));
            });
        })
    });
    describe("#isMatch", ()=>{
        const token = new Token();
        token.setTerm("term");
        token.setType("type");
        describe("When the role is literal", ()=>{
            it("should be true the value is a term name of the token", ()=>{
                const lex = new LexElement(LexRole.lit, "term", false);
                assert.isTrue(lex.isMatch(token));
            });
            it("should be false the value is a type name of the token", ()=>{
                const lex = new LexElement(LexRole.lit, "type", false);
                assert.isFalse(lex.isMatch(token));
            });
            it("should be case insensitive", ()=>{
                const lex = new LexElement(LexRole.lit, "TerM", false);
                assert.isTrue(lex.isMatch(token));
            });
        });
        describe("When the role is lexical element", ()=>{
            it("should be true the value is a type name of the token", ()=>{
                const lex = new LexElement(LexRole.lex, "type", false);
                assert.isTrue(lex.isMatch(token));
            });
            it("should be false the value is a term name of the token", ()=>{
                const lex = new LexElement(LexRole.lex, "term", false);
                assert.isFalse(lex.isMatch(token));
            });
            it("should be case insensitive", ()=>{
                const lex = new LexElement(LexRole.lex, "tYPe", false);
                assert.isTrue(lex.isMatch(token));
            });
        });
    });
    describe("#getTokenValue", ()=>{
        const token = new Token();
        token.setTerm("term-name");
        token.setType("type-name");
        describe("When the role is literal", ()=>{
            it("should be true the value is a term name of the token", ()=>{
                const lex = new LexElement(LexRole.lit, "term", false);
                assert.equal(lex.getTokenValue(token), "term-name");
            });
        });
        describe("When the role is lexical element", ()=>{
            it("should be true the value is a type name of the token", ()=>{
                const lex = new LexElement(LexRole.lex, "type", false);
                assert.equal(lex.getTokenValue(token), "type-name");
            });
        });
        describe("Unknown role-id", ()=>{
            it("should throw", ()=>{
                const lex = new LexElement(new LexRole("unknown"), "type", false);
                assert.throw(()=>{
                    lex.getTokenValue(token);
                });
            });
        });
    });
});
