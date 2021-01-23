"use strict";
const LexElement = require("./lex-element.js");
const LexRole = require("./lex-role.js");
const SyntaxRule = require("./syntax-rule.js");
const Term = require("./term.js");
const Token = require("./token.js");
const debug = require("debug")("Language");

/**
 * A language syntax definition
 * @class
 * @typedef {Array<string|LexElement>} Rule
 * @typedef {function(Term):any} Evaluator
 */
class Language {
    /**
     * Define a language syntax with BNF like description.
     * @constructor
     * @param {SyntaxRule[]} rules array of syntax definition
     */
    constructor(rules) {
        /** @type {string} */
        this.root = rules[0].name;
        /** @type {Record<string, SyntaxRule>} */
        this.rules = {};
        rules.forEach(rule => {
            this.rules[rule.name] = rule;
        });
    }
    /**
     * Create a syntax rule as an element for parameter of the constructor.
     * @static
     * @public
     * @param {string} name A syntax name to reference this syntax.
     * @param {Array<Array<string|LexElement>>} rules Syntax rules.
     * A string type element in the rule is a name referencing a syntax
     * rule of the term.
     * If the term could be repeated, to end of that name,
     * put `*` which is recognized as __repetition specifier__ by the
     * parser.
     * @param {Evaluator|null} evaluator _(Optional)_ An evaluator function.
     * This is omittable when the rules contains only one term.
     * @returns {SyntaxRule} A syntax object
     */
    static syntax(name, rules, evaluator) {
        return new SyntaxRule(name, rules, evaluator);
    }
    /**
     * Tokenize the source code by lexical analysis.
     * @public
     * @param {string} source source code
     * @returns {Array<Token>} an array of lexical tokens.
     *  It contains tokens type of whitespaces, string literal, number literal, or punctuators.
     *  Types of token:
     *  1. `Language.whitespace`
     *  1. `Language.strlit`
     *  1. `Language.numlit`
     *  1. `Language.punct`
     */
    tokenize(source) {
        return Language.LexAnalyzer.parse(source);
    }
    /**
     * Analyze the codes by recursive descent parsing based on the BNF rule.
     * @public
     * @param {string|Array<Token>} source source code or token list
     * @returns {Term} result
     */
    parse(source) {
        const tokens = Array.isArray(source) ? source : this.tokenize(source);
        const result = this._parse(this.root, tokens, 0);
        if(result.nTok < tokens.length) {
            result.term.setError(
                new Error(`syntax error`),
                tokens[result.nTok]);
        }
        return result.term;
    }
    /**
     * @private
     * @param {string} name A term name
     * @param {Token[]} tokenList An array of token
     * @param {number} iTokStart index of token to start parsing
     * @returns {{term:Term, nTok:number}} A result
     */
    _parse(name, tokenList, iTokStart) {
        debug(`parse ${name}`);
        const syntax = this.rules[name];
        if(!syntax) {
            debug(`parse ${name} FATAL: No syntax rule`);
            throw new Error(`FATAL: No syntax rule for ${JSON.stringify(name)}`);
        }
        const term = this.createTerm(name);
        const rules = syntax.rules;
        let nTok = 0;
        let iToken = iTokStart;
        for(let iRule = 0; iRule < rules.length; iRule++) {
            const rule = rules[iRule];
            debug(`parse ${name} iRule: ${iRule} of ${rules.length} ${JSON.stringify(rule)}`);
            term.clear();
            nTok = 0;
            iToken = iTokStart;
            for(let iElement = 0; iElement < rule.length; iElement++) {
                const element = rule[iElement];
                const repeatSpecifier = typeof element === "string" && /\*$/.test(element);

                iToken = iTokStart + nTok;
                if(iToken >= tokenList.length) {
                    if(!repeatSpecifier) {
                        debug(`parse ${name} Error: Unexpected end of token`);
                        term.setError(new Error(`syntax error`));
                        nTok = 0;
                    }
                    debug(`parse ${name} End of token in repeating rule`);
                    break;
                }
                const token = tokenList[iToken];

                // Treat whitespaces
                if(token.isWhiteSpace()) {
                    // Whitespaces are stored to the term, but not to be
                    // analyzed, because whitespaces had no meanings.
                    term.addTerm(token);

                    // Next token will be analyzed by same rule element;
                    nTok++;
                    iElement--;
                    continue;
                }

                if(typeof element === "string") {
                    const ruleName = element.replace(/\*$/, "");
                    const subResult = this._parse(ruleName, tokenList, iToken);
                    if(subResult.term.error) {
                        if(repeatSpecifier) {
                            debug(`parse ${name} name: ignore error in the repeating term`);
                            break;
                        }
                        debug(`parse ${name} Not match to sub rule ${JSON.stringify(ruleName)}`);
                        term.setError(
                            new Error(`syntax error`),
                            subResult.term.errorToken);
                        nTok = 0;
                        break;
                    }
                    term.addTerm(subResult.term);
                    nTok += subResult.nTok;
                    if(repeatSpecifier) {
                        iElement--;
                    }
                } else {
                    const lexElement = element; // as LexElement
                    if(!lexElement.isMatch(token)) {
                        debug(`parse ${name} Not match to lexElement: ${JSON.stringify(lexElement)}`);
                        debug(`    token: ${JSON.stringify(token)}`);
                        term.setError(new Error(`syntax error`), token);
                        nTok = 0;
                        break;
                    }
                    term.addTerm(token);
                    nTok++;
                }
            }
            if(term.error == null) {
                debug(`parse ${name} End with no error`);
                break;
            }
            if(iRule + 1 >= rules.length) {
                debug(`parse ${name} !!! Parsing Error: iRule reach to the end of rules`);
                term.setError(new Error(`syntax error`));
                break;
            }
        }
        return {term, nTok};
    }
    /**
     * Evaluate an analyzed code.
     * @public
     * @param {Term} term A term returned from `Language#parse'
     * @returns {any} A value returned from the evaluator for the term.
     */
    evaluate(term) {
        const _eval = (term) => {
            const name = term.name;
            debug(`_eval: ${name}`);
            if(this.rules[name].evaluator) {
                const value = this.rules[name].evaluator(term);
                debug(`${name}.value: ${JSON.stringify(value)}`);
                return value;
            }
            if(term.elements.length === 1 && term.elements[0] instanceof Term) {
                const value = _eval(term.elements[0]);
                debug(`${name}.value: ${JSON.stringify(value)}`);
                return value;
            }
            throw new Error(`FATAL: no evaluator for the rule named ${name}`);
        };
        return _eval(term);
    }
    /**
     * @private
     * @param {string} name A rule name
     * @returns {Term} A term representing the rule
     */
    createTerm(name) {
        const term = Term.create(name, {
            contents: () => this.getContents(term),
            str: () => this.getString(term),
        });
        return term;
    }
    /**
     * @private
     * @param {Term} term term as a result that the parse method returns
     * @returns {Array} Evaluated values for each elements in the term
     */
    getContents(term) {
        const contents = term.elements.filter(
            // remove the whitespaces
            e => (e instanceof Term || !e.isWhiteSpace())
        ).map(e => {
            if(e instanceof Term) {
                const term = e; // as Term
                return this.evaluate(term);
            } else {
                const token = e; // as Token
                return token.getTerm();
            }
        });
        return contents;
    }
    /**
     * @private
     * @param {Term} term term as a result that the parse method returns
     * @returns {Array} Evaluated values for each elements in the term
     */
    getString(term) {
        const contents = term.elements.map(e => {
            if(e instanceof Term) {
                const term = e; // as Term
                return this.evaluate(term);
            } else {
                const token = e; // as Token
                return token.getTerm();
            }
        });
        return contents.join("");
    }
}
/**
 * @private
 * @class
 */
const LexAnalyzer = class {
    /**
     * @constructor
     */
    constructor() {
        this._mode = "";
        this._tokenList = [];
        this._token = null;
        this._source = "";
        this._lineNum = 1;
        this._columnPos = 1;
        this._i = 0;
        this._c = null;
    }
    /**
     * Parse lexical tokesn.
     * @param {string} source The source text to be parse.
     * @returns {Token[]} The result of parsing.
     */
    static parse(source) {
        let parser = new LexAnalyzer();
        return parser.parse(source);
    }

    /**
     * Test if the character is a kind of white-spaces.
     * @param {string} c a character.
     * @returns {boolean} the test result.
     */
    static isWhite(c) {
        return c.match(/^\s/);
    }

    /**
     * Test if the character is a kind of alphabet.
     * @param {string} c a character.
     * @returns {boolean} the test result.
     */
    static isAlpha(c) {
        return c.match(/^[_a-z]/i);
    }

    /**
     * Test if the character is a kind of digits.
     * @param {string} c a character.
     * @returns {boolean} the test result.
     */
    static isDigit(c) {
        return c.match(/^[0-9]/);
    }

    /**
     * Parse lexical tokesn.
     * @param {string} source The source text to be parse.
     * @returns {Array<Token>} The result of parsing.
     */
    parse(source) {
        this._mode = "";
        this._tokenList = [];
        this._token = null;
        this._lineNum = 1;
        this._columnPos = 1;
        this._i = 0;
        this._c = null;
        this._source = source;
        while(this._i < this._source.length) {
            this._c = this._source.charAt(this._i);
            switch(this._mode) {
                case "":
                    this.parseDefault();
                    break;
                case LexAnalyzer.WS:
                    this.parseWhiteSpace();
                    break;
                case LexAnalyzer.STRLIT:
                    this.parseIdentifier();
                    break;
                case LexAnalyzer.NUMLIT:
                    this.parseNumberLiteral();
                    break;
            }
            ++this._i;
            ++this._columnPos;
        }
        if(this._token != null) {
            this.finishToken();
        }
        return this._tokenList;
    }

    /**
     * Parse in initial state.
     * @returns {undefined}
     */
    parseDefault() {
        this._token = new Token();
        this._token.setPos(this._lineNum, this._columnPos);
        if(LexAnalyzer.isWhite(this._c)) {
            this._token.pushChar(this._c);
            this._mode = LexAnalyzer.WS;
        } else if(LexAnalyzer.isAlpha(this._c)) {
            this._token.pushChar(this._c);
            this._mode = LexAnalyzer.STRLIT;
        } else if(LexAnalyzer.isDigit(this._c)) {
            this._token.pushChar(this._c);
            this._mode = LexAnalyzer.NUMLIT;
        } else /* if(LexAnalyzer.isPunct(this._c)) */ {
            this._token.pushChar(this._c);
            this.finishToken(LexAnalyzer.PUNCT);
        }
    }

    /**
     * Parse white-spaces.
     * @returns {undefined}
     */
    parseWhiteSpace() {
        if(LexAnalyzer.isWhite(this._c)) {
            this._token.pushChar(this._c);
            if(this._c == "\n") {
                this._columnPos = 0;
                this._lineNum++;
            }
        } else {
            this.finishToken();
            this.ungetChar();
        }
    }

    /**
     * Parse an identifier.
     * @returns {undefined}
     */
    parseIdentifier() {
        if(LexAnalyzer.isAlpha(this._c)) {
            this._token.pushChar(this._c);
        } else {
            this.finishToken();
            this.ungetChar();
        }
    }

    /**
     * Parse a number literal.
     * @returns {undefined}
     */
    parseNumberLiteral() {
        if(this._c.match(/^[0-9]$/i)) {
            this._token.pushChar(this._c);
        } else {
            this.finishToken();
            this.ungetChar();
        }
    }

    /**
     * Finish the token parsing.
     * @param {string} mode A mode name to be set to the token finally.
     * If this parameter is null, the tokenizer's currently mode is used.
     * @returns {undefined}
     */
    finishToken(mode) {
        this._token.setType(mode || this._mode);
        this._token.fixTerm();
        this._tokenList.push(this._token);
        this._token = null;
        this._mode = "";
    }

    /**
     * Push back the parsing char.
     * @returns {undefined}
     */
    ungetChar() {
        --this._i;
        --this._columnPos;
    }
};
LexAnalyzer.WS = "WS";
LexAnalyzer.STRLIT = "STRLIT";
LexAnalyzer.NUMLIT = "NUMLIT";
LexAnalyzer.PUNCT = "PUNCT";

Language.literal = (value) => new LexElement(LexRole.lit, value, false);
Language.lex = (value) => new LexElement(LexRole.lex, value, false);
Language.whitespace = Language.lex(LexAnalyzer.WS);
Language.strlit = Language.lex(LexAnalyzer.STRLIT);
Language.numlit = Language.lex(LexAnalyzer.NUMLIT);
Language.punct = Language.lex(LexAnalyzer.PUNCT);
Language.LexAnalyzer = LexAnalyzer;
module.exports = Language;
