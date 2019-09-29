"use strict";
const debug = require("debug")("BNF");
const deepEqual = require("deep-equal");
const LexAnalyzer = require("./lexana.js");
const BnfResult = require("./bnf-result.js");

/**
 * BNF processor.
 * @constructor
 * @param {string} root The root term name that must be in bnf object as a key.
 * @param {object} bnf The BNF definition object.
 * @param {object} linkedWordTokenTypeMap The word definition.
 */
function BNF(root, bnf, linkedWordTokenTypeMap) {
    this._root = root;
    this._bnf = bnf;
    this._linkedWordTokenTypeMap = linkedWordTokenTypeMap;
    this._termsOfWord =
        (linkedWordTokenTypeMap == null ? [] :
            Object.keys(linkedWordTokenTypeMap));
}

BNF.literal = function(value) {
    return {
        role: "lit",
        value: value,
        inverse: false,
    };
};

BNF.literalUntil = function(value) {
    return {
        role: "lit",
        value: value,
        inverse: true,
    };
};

BNF.lex = function(value) {
    return {
        role: "lex",
        value: value,
        inverse: false,
    };
};

BNF.lexTypeUntil = function(value) {
    return {
        role: "lex",
        value: value,
        inverse: true,
    };
};

BNF.ident = BNF.lex("IDENT");
BNF.numlit = BNF.lex("NUMLIT");
BNF.strlitDQ = BNF.lex("STRLIT-DQ");
BNF.strlitSQ = BNF.lex("STRLIT-SQ");
BNF.comma = BNF.literal(",");

/**
 * Parse the source text with this BNF definition.
 * @param {string} source the input text.
 * @param {BNF} tokenizer the tokenizer defining words.
 * @returns {Array<BnfResult>} the result of parsing.
 */
BNF.prototype.parse = function(source, tokenizer) {
    debug(`BNF.parse source: ${source}`);
    let tokens = BNF.tokenize(source, tokenizer);
    if(tokens != null && !Array.isArray(tokens) && !tokens.match) {
        debug(`BNF.parse returns ${tokens.constructor.name} ${JSON.stringify(tokens, null, 2)}`);
        return tokens; // tokens is BnfResult object.
    }
    debug(`BNF.parse tokens:\n${tokens.map(t=>JSON.stringify(t)).join("\n")}`);
    const result = this.parseSentence(this._root, tokens, 0, 0);
    //debug(`BNF.parse returns ${result.constructor.name}\n${JSON.stringify(result, null, 4)}`);
    debug(`${result.constructor.name}\n${result.toString()}`);
    //debug(`BNF.parse returns ${result.map(item=>JSON.stringify(item)).join("\n")}`);
    return result;
};

/**
 * Tokenize the source text with this the tokenizer.
 * @param {string} source the input text.
 * @param {BNF} tokenizer the tokenizer defining words.
 * @returns {Array<BnfResult>} the word list.
 */
BNF.tokenize = function(source, tokenizer) {
    debug(`BNF.tokenize source: ${source}`);
    let tokens = LexAnalyzer.parse(source);
    if(tokenizer != null) {
        debug(`BNF.tokenize tokenizer is NOT null. About to build words`);
        tokens = tokenizer.buildWords(tokens);
    }
    //Remove whitespaces
    if(Array.isArray(tokens)) {
        debug(`BNF.tokenize tokens is Array. About to Remove white spaces`);
        tokens = tokens.filter(
            lex => lex != null && !lex.isWhiteSpace());
    }
    debug(`BNF.parse returns ${tokens.constructor.name} ${JSON.stringify(tokens, null, 2)}`);
    return tokens;
};

/**
 * Build a word list with this BNF definition from given lexical tokens.
 * @param {Array<BnfResult>} tokens lexical tokens.
 * @returns {Array<BnfResult>} the word list.
 */
BNF.prototype.buildWords = function(tokens) {
    for(;;) {
        let result = this.parseSentence(this._root, tokens, 0, 0);
        if(!result.match || result._error) {
            return result;
        }
        let tokens2 = result.rebuildWords(
                this._termsOfWord,
                this._linkedWordTokenTypeMap);
        if(deepEqual(tokens2, tokens)) {
            break;
        } else {
            tokens = tokens2;
        }
    }
    return tokens;
};

/**
 * Parse the token list with this BNF definition.
 * @param {Array<BnfResult>} tokens the token list.
 * @returns {Array<BnfResult>} the result of parsing.
 */
BNF.prototype.parseTokens = function(tokens) {
    let result = this.parseSentence(this._root, tokens, 0, 0);
    return result;
};

BNF.prototype.parseSentence = function(root, lexList, lexIndex, indent) {
    if(!(root in this._bnf)) {
        throw new Error(root + " is not declared in BNF");
    }
    let declaration = this._bnf[root];
    let nDecl = declaration.length;
    declaration.forEach((d,i) => {
        debug(`${"==".repeat(indent)}> BNF.parseSentence ${root}[${i}] ${d.map(item=>JSON.stringify(item)).join(" => ")}`);
    });

    let sentenceResult = new BnfResult();
    sentenceResult.match = false;
    sentenceResult.term = root;

    for(let iDecl = 0; iDecl < nDecl; iDecl++) {
        let termList = declaration[iDecl];
        debug(`${"==".repeat(indent)}> ${root}[${iDecl}] ${termList.map(item=>JSON.stringify(item)).join(" => ")}`);
        let termListResult = this.parseTermList(termList, lexList, lexIndex, indent + 1);
        if(termListResult._error) {
            debug(`BNF.parseSentence ERROR: ${JSON.stringify({ iDecl, nDecl, termList })}`);
            debug(`BNF.parseSentence(${JSON.stringify({ root, lex: lexList[lexIndex]._term, lexIndex, indent })}`);
            sentenceResult.match = termListResult.match;
            sentenceResult.lexCount += termListResult.lexCount;
            sentenceResult._error = true;
            break;
        } else if(termListResult.match) {
            sentenceResult.match = true;
            sentenceResult.lexCount += termListResult.lexCount;
            sentenceResult.terms = termListResult.terms;
            debug(`${"==".repeat(indent)}> parseSentence MATCH term:${root}: ${JSON.stringify(lexList.slice(lexIndex, lexIndex + sentenceResult.lexCount).map(L=>L._term).join(" "))}`);
            debug(`${"==".repeat(indent)}> parseSentence termList: ${JSON.stringify(termList)}`);
            break;
        }
    }
    if(!sentenceResult.match) {
        debug(`${"==".repeat(indent)}> parseSentence UNMATCH term:${root}`);
        debug(`${"==".repeat(indent)}> parseSentence declaration: ${JSON.stringify(declaration)}`);
    }
    return sentenceResult;
};

BNF.prototype.parseTermList = function(termList, lexList, lexIndex, indent) {
    if(termList == null) {
        throw new Error("Illegal termList is entried in BNF --- " + JSON.stringify(termList));
    }
    let nTerm = termList.length;

    let termListResult = new BnfResult();
    termListResult.match = true;

    for(let iTerm = 0; iTerm < nTerm; iTerm++) {
        debug(`${"--".repeat(indent)}> parseTermList Loop: ${iTerm}/${nTerm} ${JSON.stringify(termList[iTerm])}`);
        let term = termList[iTerm];
        if(term == null) {
            throw new Error("null term is entried at " + iTerm);
        }
        let termResult = new BnfResult();
        termResult.match = false;
        termResult.lex = null;
        termResult.optional = false;
        termResult.term = term;

        let termType = typeof(term);
        if(termType != "string" && termType !== "object" || Array.isArray(term)) {
            throw new Error("Illegal BNF definition at " + JSON.stringify(term));
        }
        if(termType === "string") {
            termResult.optional = (term.match(/^\[.*\]$/) ? true : false);
            term = term.replace(/^\[(.*)\]$/, "$1");
            termResult.term = term;
            if(lexIndex < lexList.length) {
                let sentenceResult = this.parseSentence(term, lexList, lexIndex, indent);
                termResult.match = sentenceResult.match;
                termResult._error = sentenceResult._error;
                termResult.terms = sentenceResult.terms;
                if(termResult.match) {
                    termListResult.lexCount += sentenceResult.lexCount;
                    lexIndex += sentenceResult.lexCount;
                }
            }
        } else {
            // term is an object
            if(lexIndex < lexList.length) {
                termResult.lex = lexList[lexIndex];
                let lexValue = null;
                switch(termResult.term.role) {
                    case "lit": lexValue = termResult.lex.getTerm(); break;
                    case "lex": lexValue = termResult.lex.getType(); break;
                }

                termResult.match = (lexValue.toUpperCase() === termResult.term.value.toUpperCase());
                debug(`${"--".repeat(indent)}> ${termResult.match} ${JSON.stringify(termResult.lex)} ${JSON.stringify(termResult.term)}`);
                debug(`${"  ".repeat(indent)}> ${lexValue} <=> ${termResult.term.value}`);
                if(termResult.match) {
                    if(!termResult.term.inverse) {
                        termListResult.lexCount++;
                        lexIndex++;
                    } else {
                        termResult.match = true;
                        termListResult.lexCount++;
                        lexIndex++;
                    }
                } else if(termResult.term.inverse) {
                    if(lexIndex < lexList.length - 1) {
                        termResult.match = true;
                        termListResult.lexCount++;
                        lexIndex++;
                        iTerm--;
                    } else {
                        termResult.match = false;
                        termResult._error = true;
                        termListResult.lexCount++;
                        lexIndex++;
                    }
                }
                debug(`${"--".repeat(indent)}> BNF.parseTermList test match:${termResult.match} lexValue:${lexValue} == termValue:${termResult.term.value}`);
            }
        }
        termListResult.terms.push(termResult);
        if(termResult._error) {
            debug(`BNF.parseTermList ERROR: ${JSON.stringify({ iTerm, nTerm, term, termType })}`);
            debug(`BNF.parseTermList(${JSON.stringify({ term: termList[0], lex: lexList[0]._term, lexIndex, indent })}`);
            termListResult.match = false;
            termListResult.terms = [];
            termListResult.lexCount = 0;
            termListResult._error = termResult._error;
            break;
        } else if(!termResult.optional && !termResult.match) {
            debug(`BNF.parseTermList NOT MATCH: ${JSON.stringify({ iTerm, nTerm, term, termType })}`);
            debug(`BNF.parseTermList(${JSON.stringify({ term: termList[0], lex: lexList[0]._term, lexIndex, indent })}`);
            termListResult.match = false;
            termListResult.terms = [];
            termListResult.lexCount = 0;
            termListResult._error = termResult._error;
            break;
        }
    }
    return termListResult;
};

module.exports = BNF;
