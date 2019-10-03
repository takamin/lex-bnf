"use strict";
const assert = require("chai").assert;
const BNF = require("../lib/bnf.js");
const BnfResult = require("../lib/bnf-result.js");
describe("BnfResult", ()=> {
    describe("#enumerate", ()=> {
        it("should retrieve a list of recursive elements of specific name", ()=> {
            const grammer = {
                "root": "words",
                "words": [
                    ["word", "[words]"],
                ],
                "word": [
                    [BNF.ident],
                ],
            };
            const parser = new BNF(grammer.root, grammer);
            const tokens = BNF.tokenize("A B C D")
                .filter(token=>(token != null))
                .filter(token=>(!token.isWhiteSpace()));
            const result = parser.parseTokens(tokens);
            const elements = [];
            result.enumerate("word", element=>elements.push(element));
            assert.equal(elements[0].term, "word");
            assert.equal(elements[0].terms[0].lex._term, "A");
            assert.equal(elements[0].terms[0].lex._type, "IDENT");
            assert.deepEqual(elements[0].terms[0].term,
                {role:"lex",value:"IDENT",inverse:false});
            assert.equal(elements[1].term, "word");
            assert.equal(elements[1].terms[0].lex._term, "B");
            assert.equal(elements[1].terms[0].lex._type, "IDENT");
            assert.deepEqual(elements[1].terms[0].term,
                {role:"lex",value:"IDENT",inverse:false});
            assert.equal(elements[2].term, "word");
            assert.equal(elements[2].terms[0].lex._term, "C");
            assert.equal(elements[2].terms[0].lex._type, "IDENT");
            assert.deepEqual(elements[2].terms[0].term,
                {role:"lex",value:"IDENT",inverse:false});
            assert.equal(elements[3].term, "word");
            assert.equal(elements[3].terms[0].lex._term, "D");
            assert.equal(elements[3].terms[0].lex._type, "IDENT");
            assert.deepEqual(elements[3].terms[0].term,
                {role:"lex",value:"IDENT",inverse:false});
        });
    });
});