"use strict";
const deepEqual = require("deep-equal");
const lexana = require("../lib/lexana.js");

function BNF(root, bnf, linkedWordTokenTypeMap) {
    this._root = root;
    this._bnf = bnf;
    this._linkedWordTokenTypeMap = linkedWordTokenTypeMap;
    this._termsOfWord =
        (linkedWordTokenTypeMap == null ? [] :
            Object.keys(linkedWordTokenTypeMap));
}
BNF.literal = function(value) { return { role: "lit", value: value, inverse: false }; };
BNF.literalUntil = function(value) { return { role: "lit", value: value, inverse: true }; };
BNF.lex = function(value) { return { role: "lex", value: value, inverse: false }; };
BNF.lexTypeUntil = function(value) { return { role: "lex", value: value, inverse: true }; };
BNF.ident = BNF.lex("IDENT");
BNF.numlit = BNF.lex("NUMLIT");
BNF.strlitDQ = BNF.lex("STRLIT-DQ");
BNF.strlitSQ = BNF.lex("STRLIT-SQ");
BNF.comma = BNF.literal(",");

let log = function() {};
BNF.setDebug = function(debug) {
    if(debug) {
        log = function() {
            let arg = Array.from(arguments);
            let indent = arg.splice(0,1);
            console.log("  ".repeat(indent) + arg.join(" "));
        }
    } else {
        log = function() {};
    }
};

BNF.ParseResult = function() {
    this._syntaxError = false;
};
BNF.ParseResult.prototype.existsTerm = function(name) {
    let term = this.getTerm(name);
    if(term !== false) {
        return term.match;
    }
    return false;
};
BNF.ParseResult.prototype.getTerm = function(name) {
    let n = this.terms.length;
    for(let i = 0; i < n; i++) {
        if(this.terms[i].term === name) {
            log(0, "[BNF.ParseResult.getTerm]", name, "found");
            return this.terms[i];
        }
    }
    log(0, "[BNF.ParseResult.getTerm]", name, "NOT found");
    return false;
};

BNF.ParseResult.prototype.getWordsList = function(termName, indent) {
    termName = termName || "*";
    indent = indent || 0;
    let words = [];
    this.terms.forEach(function(term) {
        if(term.match) {
            if(termName === "*" || term.term === termName) {
                let subWords = term.getTermsList();
                log(indent, "WORDS:", JSON.stringify(subWords));
                words.push(subWords);
            } else {
                let subWords = term.getWordsList(termName, indent + 1);
                log(indent, "SUBWORDS:", JSON.stringify(subWords));
                subWords.forEach((subWord)=>{
                    words.push(subWord);
                });
            }
        }
    });
    return words;
};
BNF.ParseResult.prototype.getTermsList = function(indent) {
    indent = indent || 0;
    let s = [];
    this.terms.forEach(function(term) {
        if(term.terms.length == 0) {
            s.push(term.lex.getTerm());
        } else {
            term.getTermsList(indent+1).forEach(function(term) {
                s.push(term);
            });
        }
    });
    log(indent, s.join('|'));
    return s;
};

BNF.ParseResult.prototype.buildWord = function(type) {
    let lex = null;
    let s = [];
    this.terms.forEach( term => {
        let subLex = null;
        if(term.lex != null) {
            subLex = term.lex;
        } else {
            subLex = term.buildWord( type );
        }
        if(subLex != null) {
            if(lex == null) {
                lex = subLex;
            }
            s.push(subLex.getTerm());
        }
    });
    if(lex != null) {
        lex.setType(type);
        lex.setTerm(s.join(""));
    }
    return lex;
};

BNF.ParseResult.prototype.rebuildTokenList = function(
        termsOfWord, linkedWordTokenTypeMap)
{
    let lexList = [];
    this.terms.forEach( childTerm => {
        if(childTerm.match) {
            let term = childTerm.term;
            if(typeof(term) === "string"
                && termsOfWord.indexOf(term) >= 0)
            {
                let lexType = linkedWordTokenTypeMap[term];
                let lex = childTerm.buildWord(lexType);
                log(0, "token(built):", JSON.stringify(lex));
                lexList.push(lex);
            } else {
                let childLex = childTerm.lex;
                if(childLex != null) {
                    log(0, "token:", JSON.stringify(childLex));
                    lexList.push(childLex);
                }
                childTerm.rebuildTokenList(
                    termsOfWord, linkedWordTokenTypeMap
                ).forEach( lex => { lexList.push(lex); });
            }
        }
    });
    return lexList;
};

BNF.prototype.parse = function(source, bnfWordBuilder) {
    let tokens = BNF.tokenize(source, bnfWordBuilder);
    if(tokens != null && !Array.isArray(tokens) && !tokens.match) {
        return tokens; // tokens is BNF.Result object.
    }
    return this.parseTokens(tokens);
};

BNF.tokenize = function(source, bnfWordBuilder) {

    log(0, "[BNF.parse] source:", source);

    let tokens = lexana.parseLexicalElements(source);

    if(bnfWordBuilder != null) {
        let i = 0;
        for(;;) {
            log(0, "[BNF.tokenize] [",i,"] About to build words");
            let result = bnfWordBuilder.parseLexToken(tokens);
            if(!result.match || result._error) {
                log(0, "[BNF.tokenize] Fail to build words");
                log(0, "[BNF.tokenize] result:", JSON.stringify(result));
                return result;
            }
            let tokens2 = bnfWordBuilder.rebuildTokenList(result);
            if(deepEqual(tokens2, tokens)) {
                break;
            } else {
                tokens = tokens2;
            }
            i++;
        }
    }
    log(0, "[BNF.tokenize] The end of building words ");

    //Remove whitespaces
    tokens = tokens.filter( lex => {
        return lex != null && !lex.isWhiteSpace();
    });

    log(0, "[BNF.tokenize]tokens:[");
    tokens.forEach( (e,i) => { log(1, "[" + i + "]", JSON.stringify(e)); });
    log(0, "]");

    return tokens;
};

BNF.prototype.parseLexToken = function(tokens) {
    return this.parseSentence(this._root, tokens, 0, 0);
};

BNF.prototype.rebuildTokenList = function(result) {
    let tokens = result.rebuildTokenList(
            this._termsOfWord,
            this._linkedWordTokenTypeMap);
    return tokens;
};

BNF.prototype.parseTokens = function(tokens) {

    log(0, "[BNF.parseTokens]tokens:[");
    tokens.forEach( (e,i) => { log(1, "[" + i + "]", JSON.stringify(e)); });
    log(0, "]");

    let result = this.parseSentence(this._root, tokens, 0, 0);

    BNF.logResult(result);
    log(0, "[BNF.parseTokens] result:", JSON.stringify(result));

    return result;
};

BNF.prototype.parseSentence = function(root, lexList, lexIndex, indent) {
    log(indent, "BNF:", root, "(at", lexIndex, ")");
    if(!(root in this._bnf)) {
        throw new Error(root + " is not declared in BNF");
    }
    let declaration = this._bnf[root];
    let nDecl = declaration.length;

    let result = new BNF.ParseResult();
    result.match = false;
    result.term = root;
    result.lexCount = 0;
    result.terms = [];

    for(let iDecl = 0; iDecl < nDecl; iDecl++) {
        let termList = declaration[iDecl];
        try {
            let termResult = this.parseTermList(termList, lexList, lexIndex, indent + 1);
            if(termResult._error) {
                result.match = termResult.match;
                result._error = true;
                result.lexCount += termResult.lexCount;
                break;
            } else if(termResult.match) {
                result.terms = termResult.terms;
                result.match = true;
                result.lexCount += termResult.lexCount;
                break;
            }
        } catch (err) {
            throw new Error(err.message + "\nat " + root + "[" + iDecl + "]");
        }
    }
    return result;
};

BNF.prototype.parseTermList = function(termList, lexList, lexIndex, indent) {
    if(termList == null) {
        throw new Error("Illegal termList is entried in BNF --- " + JSON.stringify(termList));
    }
    let nTerm = termList.length;

    let result = new BNF.ParseResult();
    result.match = true;
    result.lexCount = 0;
    result.terms = [];

    for(let iTerm = 0; iTerm < nTerm; iTerm++) {
        let term = termList[iTerm];
        if(term == null) {
            throw new Error("null term is entried at " + iTerm);
        }
        let termResult = new BNF.ParseResult();
        termResult.term = termList[iTerm];
        termResult.match = false;
        termResult.lex = null;
        termResult.optional = false;
        termResult.terms = [];

        let termType = typeof(termResult.term);
        if(termType != "string" && termType !== "object" || Array.isArray(termResult.term)) {
            throw new Error("Illegal BNF definition at " + JSON.stringify(termResult.term));
        }
        if(termType === "string") {
            termResult.optional = (termResult.term.match(/^\[.*\]$/) ? true : false);
            termResult.term = termResult.term.replace(/^\[(.*)\]$/, "$1");
            if(lexIndex < lexList.length) {
                let subResult = this.parseSentence(termResult.term, lexList, lexIndex, indent);
                termResult.match = subResult.match;
                termResult._error = subResult._error;
                termResult.terms = subResult.terms;
                if(termResult.match) {
                    result.lexCount += subResult.lexCount;
                    lexIndex += subResult.lexCount;
                }
            }
        } else {
            if(lexIndex < lexList.length) {
                termResult.lex = lexList[lexIndex];
                let lexValue = null;
                switch(termResult.term.role) {
                    case "lit": lexValue = termResult.lex.getTerm(); break;
                    case "lex": lexValue = termResult.lex.getType(); break;
                }

                termResult.match = (lexValue.toUpperCase() === termResult.term.value.toUpperCase());
                if(termResult.match) {
                    if(!termResult.term.inverse) {
                        result.lexCount++;
                        lexIndex++;
                        log(indent, "match: ", JSON.stringify(termResult.lex),
                                "( at " + lexIndex + ")");
                    } else {
                        termResult.match = true;
                        result.lexCount++;
                        lexIndex++;
                    }
                } else if(termResult.term.inverse) {
                    if(lexIndex < lexList.length - 1) {
                        termResult.match = true;
                        result.lexCount++;
                        lexIndex++;
                        iTerm--;
                    } else {
                        log(indent, "Syntax error: The literal-until term at last: The block was not closed");
                        log(indent, "lexIndex:", lexIndex);
                        log(indent, "lexList.length:", lexList.length);
                        log(indent, "termResult.lex:", JSON.stringify(termResult.lex));
                        log(indent, "**** inversed at last ****");
                        termResult.match = false;
                        termResult._error = true;
                        result.lexCount++;
                        lexIndex++;
                    }
                }
            }
        }
        result.terms.push(termResult);
        if(termResult._error) {
            result.match = false;
            result._error = termResult._error;
            result.lexCount = 0;
            result.terms = [];
            break;
        } else if(!termResult.optional && !termResult.match) {
            result.match = false;
            result._error = termResult._error;
            result.lexCount = 0;
            result.terms = [];
            break;
        }
    }
    return result;
};

BNF.logResult = function(parseResult) {
    BNF._logResult(parseResult.terms);
};

BNF._logResult = function(parseResult, indent) {
    indent = indent || 0;
    parseResult.forEach(function(e) {
        if(e.terms.length > 0) {
            log(indent, e.term);
            BNF._logResult(e.terms, indent + 1);
        } else if(e.lex) {
            log(indent, JSON.stringify(e.term),
                    JSON.stringify(e.lex.getTerm()));
        }
    });
};
module.exports = BNF;
