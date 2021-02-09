"use strict";
// eslint-disable-next-line no-unused-vars
const debug = require("debug")("BNF");
const deepEqual = require("deep-equal");
const LexAnalyzer = require("./_lex-analyzer.js");
const BnfResult = require("./_bnf-result.js");
const LexRole = require("./lex-role.js");
const LexElement = require("./lex-element.js");

/**
 * BNF processor.
 * @deprecated Use Language class instead
 * @constructor
 * @typedef {Record<string, Array<Array<string|LexElement>>>} BnfSyntaxDef
 * @typedef {Record<string, string>} BnfTypeMap
 * @param {string} root The root term name that must be in bnf object as a key.
 * @param {BnfSyntaxDef} bnf The BNF definition object.
 * @param {BnfTypeMap} linkedWordTokenTypeMap The word definition.
 */
function BNF(root, bnf, linkedWordTokenTypeMap) {
    this._root = root;
    this._bnf = bnf;
    this._linkedWordTokenTypeMap = linkedWordTokenTypeMap;
    this._termsOfWord =
        (linkedWordTokenTypeMap == null ? [] :
            Object.keys(linkedWordTokenTypeMap));
}

BNF.literal = (value) => new LexElement(LexRole.lit, value, false);
BNF.literalUntil = (value) => new LexElement(LexRole.lit, value, true);
BNF.lex = (value) => new LexElement(LexRole.lex, value, false);
BNF.lexTypeUntil = (value) => new LexElement(LexRole.lex, value, true);

/** @type {LexElement} */
BNF.ident = BNF.lex("IDENT");
/** @type {LexElement} */
BNF.numlit = BNF.lex("NUMLIT");
/** @type {LexElement} */
BNF.strlitDQ = BNF.lex("STRLIT-DQ");
/** @type {LexElement} */
BNF.strlitSQ = BNF.lex("STRLIT-SQ");
/** @type {LexElement} */
BNF.comma = BNF.literal(",");

/**
 * Parse the source text with this BNF definition.
 * @param {string} source the input text.
 * @param {BNF} tokenizer the tokenizer defining words.
 * @return {Array<BnfResult>} the result of parsing.
 * @deprecated Use BNF.tokenize and BNF#parseTokens
 */
BNF.prototype.parse = function(source, tokenizer) {
    const tokens = BNF.tokenize(source, tokenizer);
    return this.parseTokens(tokens);
};

/**
 * Tokenize the source text.
 *
 * TOKENIZE
 * --------
 *
 * At first, `source` is converted to a token list by `LexAnalyzer.parse`.
 *
 * BINDING TOKENS
 * --------------
 *
 * And if the parameter `tokenizer` is a BNF object, `tokenizer.buildWords`
 * binds the specific tokens in the list and converts it to a new token.
 *
 * REMOVING WHITE SPACES
 * ---------------------
 *
 * By default, all the white space tokens in the list are removed.
 * But if the `tokenizer` is `false`, the binding words and removing the tokens
 * are not done.
 *
 * @param {string} source the input text.
 * @param {BNF|boolean|undefined} tokenizer the tokenizer defining words
 *  binding or false not to invoke buildWords and remove the white spaces
 *  from tokens.
 * @return {Array<BnfResult>} the word list.
 */
BNF.tokenize = function(source, tokenizer) {
    let tokens = LexAnalyzer.parse(source);
    if(tokenizer != null && tokenizer.constructor === BNF) {
        tokens = tokenizer.buildWords(tokens);
    }
    // Remove whitespaces
    if(Array.isArray(tokens) && tokenizer !== false) {
        tokens = tokens.filter(
            (lex) => lex != null && !lex.isWhiteSpace());
    }
    return tokens;
};

/**
 * Build a word list with this BNF definition from given lexical tokens.
 * @param {Array<BnfResult>} tokens lexical tokens.
 * @return {Array<BnfResult>} the word list.
 */
BNF.prototype.buildWords = function(tokens) {
    for(;;) {
        const result = this.parseSentence(this._root, tokens, 0);
        if(!result.match || result._error) {
            return result;
        }
        const tokens2 = result.rebuildWords(
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
 * @return {Array<BnfResult>} the result of parsing.
 */
BNF.prototype.parseTokens = function(tokens) {
    const result = this.parseSentence(this._root, tokens, 0);
    return result;
};

/**
 * @param {string} root A name of BNF definition to start parsing
 * @param {Token[]} tokens An array of lexical element
 * @param {number} startIndexToken index of tokens to parse
 * @return {BnfResult} result
 */
BNF.prototype.parseSentence = function(root, tokens, startIndexToken) {
    const termDecl = this._bnf[root];
    const result = BnfResult.forTerm(root);
    result.currentToken = tokens[startIndexToken];
    for(const termList of termDecl) {
        let iToken = startIndexToken;
        const nTerm = termList.length;
        const termListResult = BnfResult.forTermList();
        for(let iTerm = 0; iTerm < nTerm; iTerm++) {
            const term = termList[iTerm];
            termListResult.currentToken = tokens[iToken];
            debug(`${iTerm}/${nTerm} term: ${JSON.stringify(term)}`);
            const termResult = BnfResult.forTerm(term);
            termResult.currentToken = tokens[iToken];
            if(iToken < tokens.length) {
                debug(`parseTerm:token[${iToken}/${tokens.length}]: ${JSON.stringify(tokens[iToken])}`);
                let consumedToken = 0;
                if(termResult.term instanceof LexElement) {
                    termResult.setLexForTerm(tokens[iToken], termResult.term);
                    if(!termResult.match && termResult.term.inverse) {
                        if(iToken < tokens.length - 1) {
                            termResult.match = true;
                        } else {
                            termResult.match = false;
                            termResult._error = true;
                        }
                    }
                    debug(`  parseTerminator:termResult: err:${termResult._error}, match:${termResult.match}`);
                    consumedToken = 1;
                } else {
                    const sentenceResult = this.parseSentence(termResult.term, tokens, iToken);
                    termResult.setSentenceResult(sentenceResult);
                    termResult.currentToken = sentenceResult.currentToken;
                    debug(`  parseNotTerminator:termResult: err:${termResult._error}, match:${termResult.match}`);
                    if(sentenceResult.match) {
                        consumedToken = sentenceResult.lexCount;
                    }
                }
                termListResult.currentToken = termResult.currentToken;
                if(termResult.term instanceof LexElement) {
                    if(termResult.match && termResult.term.inverse) {
                        if(iToken < tokens.length - 1) {
                            iTerm--;
                        }
                    }
                }
                if(debug.enabled) {
                    if(termResult._error || !termResult.match) {
                        debug(`!match ${JSON.stringify(tokens[iToken])}`);
                    }
                }
                termListResult.lexCount += consumedToken;
                iToken += consumedToken;
            }
            termListResult.pushTermResult(termResult);
            if(termResult._error || (!termResult.optional && !termResult.match)) {
                break;
            }
        }
        result.currentToken = termListResult.currentToken;
        result.setTermListResult(termListResult);
        if(result._error || result.match) {
            break;
        }
    }
    return result;
};
module.exports = BNF;
