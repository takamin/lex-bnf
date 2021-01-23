"use strict";
const assert = require("chai").assert;
const Language = require("../lib/language.js");
const {syntax, literal: lit, numlit} = Language;
const langCalc = require("../sample/calc.js");
const debug = require("debug")("Language");
describe("Language", () => {
    describe("parse", () => {
        it("should throw, if syntax does not exits", ()=>{
            assert.throw(()=>{
                const lang = new Language([
                    syntax("calc", [["expression"]]),
                ]);
                lang.parse("1+2");
            });
        });
        it("should be error the expression is incomplete", ()=>{
            const expr = `1 + `;
            const tokens = langCalc.tokenize(expr);
            const result = langCalc.parse(tokens);
            assert.instanceOf(result.error, Error);
        });
        it("should accept a token list", ()=>{
            const expr = `1 + 2`;
            const tokens = langCalc.tokenize(expr);
            const result = langCalc.parse(tokens);
            debug(`result: ${JSON.stringify(result, null, 2)}`);
            const value = langCalc.evaluate(result);
            assert.isNull(result.error);
            assert.equal(value, 3);
        });
        it("should throw error, if rule contains invalid element", ()=>{
            assert.throw(()=>{
                const lang = new Language([
                    syntax("floating-constant",
                        [
                            [numlit, 1, numlit],
                        ]),
                ]);
                lang.parse("123");
            });
        });
        describe("Issue of the right recursion (Issue #14)", ()=>{
            describe("evaluation expression '1 - 2 - 3'", ()=>{
                it("should be (-1) in right-recursive definition", ()=>{
                    const lang = new Language([
                        syntax("additive-expression",
                            [
                                ["integer-constant", lit("-"), "additive-expression"],
                                ["integer-constant"],
                            ],
                            (term) => {
                                const terms = term.contents();
                                const [a, ope, b] = terms;
                                return !ope ? a : ope == "+" ? a + b: a - b;
                            }),
                        syntax("integer-constant", [[numlit]], (term) => parseInt(term.str())),
                    ]);
                    const expr = `1 - 2 - 3`;
                    const result = lang.parse(expr);
                    const value = lang.evaluate(result);
                    assert.isNull(result.error);
                    assert.equal(value, 2);
                });
                it("should be (-4) with repeating definition", ()=>{
                    const lang = new Language([
                        syntax("additive-expression",
                            [["integer-constant", "additive-expression-rest*"]],
                            (term) => {
                                debug(`additive-expression.term: ${JSON.stringify(term, null, 2)}`);
                                const terms = [].concat(...term.contents());
                                debug(`additive-expression.terms: ${JSON.stringify(terms, null, 2)}`);
                                let acc = terms[0];
                                for(let i = 1; i < terms.length; i += 2) {
                                    const ope = terms[i];
                                    const value = terms[i + 1];
                                    acc -= value;
                                }
                                return acc;
                            }),
                        syntax("additive-expression-rest",
                            [
                                [lit("-"), "integer-constant"],
                            ],
                            term => term.contents()),
                        syntax("integer-constant", [[numlit]], (term) => parseInt(term.str())),
                    ]);
                    const expr = `1 - 2 - 3`;
                    const result = lang.parse(expr);
                    const value = lang.evaluate(result);
                    assert.isNull(result.error);
                    assert.equal(value, -4);
                });
            });
            describe("Countermeasure by repeating specifier", ()=>{
                describe("Repeating rule", ()=>{
                    const lang = new Language([
                        syntax("repeat-term",
                            [[lit("A"), "repeat*"]]),
                        syntax("repeat",
                            [[lit("."), lit("A") ]]),
                    ]);
                    it("should not throw", ()=>{
                        assert.doesNotThrow(()=>{
                            lang.parse("A.A.A");
                        });
                    });
                    it("should not be error for no repeating", ()=>{
                        const result = lang.parse("A");
                        assert.isNull(result.error);
                    });
                    it("should not be error for repeating one time", ()=>{
                        const result = lang.parse("A.A");
                        assert.isNull(result.error);
                    });
                    it("should not be error for more repeating", ()=>{
                        const result = lang.parse("A.A.A");
                        assert.isNull(result.error);
                    });
                });
                describe("Not repeating rule", ()=>{
                    it("should be error", ()=>{
                        const lang = new Language([
                            syntax("repeat-term",
                                [[lit("A"), "nRepeat"]]),
                            syntax("nRepeat",
                                [[lit("."), lit("A")]]),
                        ]);
                        const result = lang.parse("A");
                        assert.isNotNull(result.error);
                    });
                    it("should be error", ()=>{
                        const lang = new Language([
                            syntax("repeat-term",
                                [[lit("A"), "nRepeat"]]),
                            syntax("nRepeat",
                                [[lit("."), lit("A")]]),
                        ]);
                        const result = lang.parse("A.A.A");
                        assert.isNotNull(result.error);
                    });
                    it("should not be error", ()=>{
                        const lang = new Language([
                            syntax("repeat-term",
                                [[lit("A"), "nRepeat"]]),
                            syntax("nRepeat",
                                [[lit("."), lit("A")]]),
                        ]);
                        const result = lang.parse("A.A");
                        assert.isNull(result.error);
                    });
                });
            });
        });
    });
    describe("evaluate", () => {
        it("should throw error, if evaluater does not exist", ()=>{
            const lang = new Language([
                syntax("floating-constant",
                    [
                        [numlit, lit("."), numlit],
                    ]),
            ]);
            const result = lang.parse("123");
            assert.throw(()=>{
                lang.evaluate(result);
            });
        });
        it("should throw error that evaluator throws", ()=>{
            const lang = new Language([
                syntax("floating-constant",
                    [["floating-real-part"]],
                    (term) => parseFloat(term.str())),
                syntax("floating-real-part",
                    [[numlit, lit("."), numlit]],
                    (term) => { throw new Error("TEST"); }),
            ]);
            const result = lang.parse("123.45");
            assert.throw(()=>{
                lang.evaluate(result);
            });
        });
    });
    describe("calc.js sample implementation", () => {
        describe("correct expression", () => {
            it("`1` should be 1", () => {
                const expr = `1`;
                const result = langCalc.parse(expr);
                const value = langCalc.evaluate(result);
                assert.isNull(result.error);
                assert.equal(value, 1);
            });
            it("`(1)` should be 1", ()=>{
                const expr = `(1)`;
                const result = langCalc.parse(expr);
                const value = langCalc.evaluate(result);
                assert.isNull(result.error);
                assert.equal(value, 1);
            });
            it("`1 + 2` should be 3", ()=>{
                const expr = `1 + 2`;
                const result = langCalc.parse(expr);
                const value = langCalc.evaluate(result);
                assert.isNull(result.error);
                assert.equal(value, 3);
            });
            it("`3 * 4` should be 12", ()=>{
                const expr = `3 * 4`;
                const result = langCalc.parse(expr);
                const value = langCalc.evaluate(result);
                assert.isNull(result.error);
                assert.equal(value, 12);
            });
            it("`5 - 6` should be -1", ()=>{
                const expr = `5 - 6`;
                const result = langCalc.parse(expr);
                const value = langCalc.evaluate(result);
                assert.isNull(result.error);
                assert.equal(value, -1);
            });
            it("`7 / 8` should be 0.875", ()=>{
                const expr = `7 / 8`;
                const result = langCalc.parse(expr);
                const value = langCalc.evaluate(result);
                assert.isNull(result.error);
                assert.equal(value, 0.875);
            });
            it("`1 - 2 - 3` should be -4", ()=>{
                const expr = `1 - 2 - 3`;
                const result = langCalc.parse(expr);
                const value = langCalc.evaluate(result);
                assert.isNull(result.error);
                assert.equal(value, -4);
            });
            it("`1 * 2 + 3 * 4` should be 14", ()=>{
                const expr = `1 * 2 + 3 * 4`;
                const result = langCalc.parse(expr);
                const value = langCalc.evaluate(result);
                assert.isNull(result.error);
                assert.equal(value, 14);
            });
            it("`1 / (2 + 3) + 4` should be 4.2", ()=>{
                const expr = `1 / (2 + 3) + 4`;
                const result = langCalc.parse(expr);
                const value = langCalc.evaluate(result);
                assert.isNull(result.error);
                assert.equal(value, 4.2);
            });
            it("`(1 + 2) * (3 + 4)` should be 21", ()=>{
                const expr = `(1 + 2) * (3 + 4)`;
                const result = langCalc.parse(expr);
                const value = langCalc.evaluate(result);
                assert.isNull(result.error);
                assert.equal(value, 21);
            });
            it("`(1 + 2) * ((3 + 4) / 2)` should be 10.5 (only parsing)", ()=>{
                const expr = `(1 + 2) * ((3 + 4) / 2)`;
                const result = langCalc.parse(expr);
                assert.isNull(result.error);
            }).timeout(5000);
            it("`(1 + 2) * ((3 + 4) / 2)` should be 10.5", ()=>{
                const expr = `(1 + 2) * ((3 + 4) / 2)`;
                const result = langCalc.parse(expr);
                const value = langCalc.evaluate(result);
                assert.isNull(result.error);
                assert.equal(value, 10.5);
            }).timeout(5000);
            it("`1.5 * 2` should be 3", ()=>{
                const expr = `1.5 * 2`;
                const result = langCalc.parse(expr);
                const value = langCalc.evaluate(result);
                assert.isNull(result.error);
                assert.equal(value, 3);
            });
            it("`1.5e+2 * -2` should be -300", ()=>{
                const expr = `1.5e+2 * -2`;
                const result = langCalc.parse(expr);
                const value = langCalc.evaluate(result);
                assert.isNull(result.error);
                assert.equal(value, -300);
            });
            it("`1.5e2 * 2` should be 300", ()=>{
                const expr = `1.5e2 * 2`;
                const result = langCalc.parse(expr);
                const value = langCalc.evaluate(result);
                assert.isNull(result.error);
                assert.equal(value, 300);
            });
            describe("Multi lines", ()=>{
                it("should not be error even if the expression contains LF", ()=>{
                    const eol = "\n";
                    const expr = `1${eol}+ 2${eol}+3${eol} +4`;
                    const result = langCalc.parse(expr);
                    const value = langCalc.evaluate(result);
                    assert.isNull(result.error);
                    assert.equal(value, 10);
                });
                it("should not be error even if the expression contains CR-LF", ()=>{
                    const eol = "\r\n";
                    const expr = `1${eol}+ 2${eol}+3${eol} +4`;
                    const result = langCalc.parse(expr);
                    const value = langCalc.evaluate(result);
                    assert.isNull(result.error);
                    assert.equal(value, 10);
                });
            });
            describe("Term#toString", ()=>{
                describe("with no syntax error", ()=>{
                    it("should not throw", ()=>{
                        assert.doesNotThrow(()=>{
                            const result = langCalc.parse("1");
                            result.toString();
                        });
                    });
                    it("should not throw", ()=>{
                        assert.doesNotThrow(()=>{
                            const result = langCalc.parse("1 + 2) * (3 + 4)");
                            result.toString();
                        });
                    });
                    it("should returns string", ()=>{
                        const result = langCalc.parse("1");
                        const s = result.toString();
                        assert.isString(s);
                    });
                });
                describe("with syntax error", ()=>{
                    it("should not throw", ()=>{
                        assert.doesNotThrow(()=>{
                            const result = langCalc.parse("(1 + 2) * xyz(3 + 4) / 2)");
                            result.toString();
                        });
                    });
                    it("should returns string", ()=>{
                        const result = langCalc.parse("(1 + 2) * xyz(3 + 4) / 2)");
                        const s = result.toString();
                        assert.isString(s);
                    });
                });
            })
        });
        describe("parsing error", () => {
            it("`+` should be parser error", ()=>{
                const expr = `+`;
                const result = langCalc.parse(expr);
                assert.instanceOf(result.error, Error);
            });
            it("`1 + 2 * 3 + 4)` should be parser error", () => {
                const expr = `1 + 2 * 3 + 4)`;
                const result = langCalc.parse(expr);
                assert.instanceOf(result.error, Error);
            });
            it("`1 + 2 * (3 + 4` should be parser error", () => {
                const expr = `1 + 2 * (3 + 4`;
                const result = langCalc.parse(expr);
                assert.instanceOf(result.error, Error);
            });
        });
        describe("evaluation error", () => {
            it("`1 .5 * 2` should throw ", () => {
                const expr = `1 .5 * 2`;
                const result = langCalc.parse(expr);
                assert.throw(()=>{
                    langCalc.evaluate(result);
                });
            });
        });
    });
});