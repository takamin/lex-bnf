"use strict";
const LexAnalyzer = require("../lib/lexana.js");
const BNF = require("../index.js");

//
// Basic Terms
//
// eslint-disable-next-line no-unused-vars
const TABLE = BNF.literal("TABLE");
const SELECT = BNF.literal("SELECT");
// eslint-disable-next-line no-unused-vars
const UPDATE = BNF.literal("UPDATE");
const FROM = BNF.literal("FROM");
const WHERE = BNF.literal("WHERE");
const FILTER = BNF.literal("FILTER");
const LIMIT = BNF.literal("LIMIT");
const BETWEEN = BNF.literal("BETWEEN");
const AND = BNF.literal("AND");
const OR = BNF.literal("OR");
const NOT = BNF.literal("NOT");
const IN = BNF.literal("IN");

let SQLISH_LEX_TOKEN_DEF = new BNF("words", {
    "words": [
        [ "word", "words", ],
        [ "word", ],
    ],
    "word": [
        [ "num-literal" ],
        [ "comparison-operator" ],
        [ "attribute-value-placeholder" ],
        [ "attribute-path-name" ],
        [ "comment-mark" ],
        [ "escaped-char" ],
        [ "string-literal" ],
        [ "block-comment" ],
        [ "line-comment" ],
        [ BNF.ident ],
        [ BNF.lex("PUNCT") ],
        [ BNF.strlitDQ ],
        [ BNF.strlitSQ ],
        [ BNF.lex("WS") ],
        [ BNF.lex("WS-LINCMT") ],
        [ BNF.lex("WS-BLKCMT") ],
    ],
    "num-literal": [
        [ "fractional-literal" ],
        [ "int-literal" ],
    ],
    "int-literal": [
        [ "dec-num-literal" ],
    ],
    "dec-num-literal": [
        [ "[sign]", BNF.lex("NUMLIT"), ],
    ],
    "sign": [
        [ BNF.literal("+") ],
        [ BNF.literal("-") ],
    ],
    "fractional-literal": [
        [ "[sign]", BNF.lex("NUMLIT"), "fractional-part" ],
    ],
    "fractional-part": [
        [ BNF.literal("."), BNF.lex("NUMLIT"), "[exp-part]", ],
    ],
    "exp-part": [
        [ BNF.literal("E"), "[sign]", BNF.lex("NUMLIT"), ],
        [ BNF.literal("e"), "[sign]", BNF.lex("NUMLIT"), ],
    ],
    "comparison-operator": [
        [ BNF.literal("<"), BNF.literal("=") ],
        [ BNF.literal("<"), BNF.literal(">") ],
        [ BNF.literal(">"), BNF.literal("=") ],
        [ BNF.literal(">"), ],
        [ BNF.literal("="), ],
        [ BNF.literal("<"), ],
    ],
    "attribute-value-placeholder": [
        [ BNF.literal(":"), BNF.ident ],
    ],
    "attribute-path-name": [
        [ BNF.ident, BNF.literal("."), "attribute-path-name" ],
        [ BNF.ident, BNF.literal("."), BNF.ident ],
    ],
    "block-comment":[
        [ BNF.literal("/*"), BNF.literalUntil("*/") ],
    ],
    "line-comment":[
        [ BNF.literal("//"), BNF.literalUntil("\n") ],
        [ BNF.literal("--"), BNF.literalUntil("\n") ],
    ],
    "comment-mark": [
        [ BNF.literal("/"), BNF.literal("*") ],
        [ BNF.literal("*"), BNF.literal("/") ],
        [ BNF.literal("/"), BNF.literal("/") ],
        [ BNF.literal("-"), BNF.literal("-") ],
    ],
    "escaped-char": [
        [ BNF.literal("\\"), BNF.literal("\\"), ],
        [ BNF.literal("\\"), BNF.literal("\""), ],
        [ BNF.literal("\\"), BNF.literal("'"), ],
    ],
    "string-literal": [
        [ "string-literal-dq" ],
        [ "string-literal-sq" ],
    ],
    "string-literal-dq": [
        [ BNF.literal('"'), "string-literal-dq-end" ],
    ],
    "string-literal-dq-end": [
        [ BNF.literalUntil('"') ],
        [ BNF.literal('"') ],
    ],
    "string-literal-sq": [
        [ BNF.literal("'"), "string-literal-sq-end" ],
    ],
    "string-literal-sq-end": [
        [ BNF.literalUntil("'") ],
        [ BNF.literal("'") ],
    ],
}, {
    "num-literal": "NUMLIT",
    "comparison-operator": "PUNCT",
    "attribute-value-placeholder": "IDENT",
    "attribute-path-name": "IDENT",
    "block-comment": "WS-BLKCMT",
    "line-comment": "WS-LINCMT",
    "comment-mark": "WS",
    "escaped-char": "PUNCT",
    "string-literal-dq": "STRLIT-DQ",
    "string-literal-sq": "STRLIT-SQ",
});

let SQLISH_BNF_DEF = {
    "sqlish-query": [
        [ "[select-clause]", "from-clause", "where-key-clause",
            "[filter-clause]", "[limit-clause]" ],
    ],
    "select-clause": [
        [ SELECT, "key-list" ],
    ],
    "key-list": [
        [ "column-name", BNF.comma, "key-list" ],
        [ "column-name" ],
    ],
    "column-name": [
        [ BNF.ident ],
    ],
    "from-clause": [
        [ FROM, "table-name" ],
    ],
    "table-name": [
        [ BNF.ident ],
    ],
    "where-key-clause": [
        [ WHERE, "condition-expression" ],
    ],
    "filter-clause": [
        [ FILTER, "condition-expression" ],
    ],
    "condition-expression" : [
        [ "or-expression" ],
    ],
    "or-expression" : [
        [ "and-expression", OR, "condition-expression" ],
        [ "and-expression" ],
    ],
    "and-expression" : [
        [ "compare-expression", AND, "condition-expression" ],
        [ "compare-expression" ],
    ],
    "compare-expression": [
        [ BNF.literal("("), "condition-expression", BNF.literal(")") ],
        [ BNF.ident, "comparator", "value" ],
        [ BNF.ident, BETWEEN, "between-range" ],
        [ BNF.ident, IN, BNF.literal("("), "value-list", BNF.literal(")") ],
        [ "function" ],
        [ NOT, "condition-expression" ],
    ],
    "comparator": [
        [BNF.literal("=") ],
        [BNF.literal("<") ],
        [BNF.literal("<=") ],
        [BNF.literal(">") ],
        [BNF.literal(">=") ],
        [BNF.literal("<>") ],
    ],
    "function": [
        [ BNF.literal("attribute_exists"), BNF.literal("("), "path", BNF.literal(")") ],
        [ BNF.literal("attribute_not_exists"), BNF.literal("("), "path", BNF.literal(")") ],
        [ BNF.literal("attribute_type"), BNF.literal("("),
                "path", BNF.comma, "attribute-type",
            BNF.literal(")") ],
        [ BNF.literal("begins_with"), BNF.literal("("),
                "path", BNF.comma, "value",
            BNF.literal(")") ],
        [ BNF.literal("contains"), BNF.literal("("),
                "path", BNF.comma, "value",
            BNF.literal(")") ],
        [ BNF.literal("size"), BNF.literal("("), "path", BNF.literal(")") ],
    ],
    "path": [
        [ BNF.ident, BNF.literal("."), "path" ],
        [ BNF.ident ],
    ],
    "between-range": [
        [ "value", AND, "value" ],
    ],
    "value-list": [
        ["value", BNF.comma, "value-list" ],
        ["value" ],
    ],
    "value": [
        [ BNF.numlit ],
        [ BNF.strlitDQ ],
        [ BNF.strlitSQ ],
        [ BNF.ident ],
    ],
    "limit-clause": [
        [ LIMIT, "limit-count" ],
    ],
    "limit-count": [
        [ BNF.numlit ],
    ],
    "key-type": [
        [ BNF.literal("HASH") ],
        [ BNF.literal("RANGE") ],
    ],
    "key-attribute-type": [
        [ BNF.literal("S") ],
        [ BNF.literal("N") ],
        [ BNF.literal("BOOL") ],
    ],
    "attribute-type": [
        [ BNF.literal("S") ],
        [ BNF.literal("SS") ],
        [ BNF.literal("N") ],
        [ BNF.literal("NS") ],
        [ BNF.literal("B") ],
        [ BNF.literal("BS") ],
        [ BNF.literal("BOOL") ],
        [ BNF.literal("NULL") ],
        [ BNF.literal("L") ],
        [ BNF.literal("M") ],
    ],
};

/**
 * Interpret a SQLish sentence to a DynamoDb QUERY API parameter.
 * @param {string} source A sentence to convert
 * @returns {object} as a parameter for the QUERY API of DynamoDb
 */
function parseSqlishQuery(source) {

    let lexTokens = LexAnalyzer.parse(source);
    let bindedTokens = SQLISH_LEX_TOKEN_DEF.buildWords(lexTokens);
    let tokens = bindedTokens.filter(
        lex => lex != null && !lex.isWhiteSpace());

    if(tokens != null && !Array.isArray(tokens) && !tokens.match) {
        return tokens; // tokens is BNF.Result object.
    }
    tokens.forEach( token => {
        let term = token.getTerm();
        switch(token.getType()) {
        case "STRLIT-DQ":
            // eslint-disable-next-line no-undef
            token.setTerm("\"" + unescapeDQ(term.replace(/^"(.*)"$/, "$1")) + "\"");
            break;
        case "STRLIT-SQ":
            // eslint-disable-next-line no-undef
            token.setTerm("'" + unescapeSQ(term.replace(/^'(.*)'$/, "$1")) + "'");
            break;
        default:
            break;
        }
    });

    let bnf = new BNF("sqlish-query", SQLISH_BNF_DEF);
    let st = bnf.parseTokens(tokens);
    let opt = {};

    let fromClause = st.getTerm("from-clause");
    if(!fromClause.match) {
        throw new Error("the from-clause not found");
    } else {
        opt.TableName = fromClause.getWordsList("table-name")[0].join("");
    }

    let whereClause = st.getTerm("where-key-clause");
    if(!whereClause.match) {
        throw new Error("the where clause not found");
    } else {
        opt.KeyConditionExpression =
            whereClause.getWordsList("condition-expression")[0].join(" ");
    }

    let selectClause = st.getTerm("select-clause");
    if(selectClause.match) {
        opt.ProjectionExpression =
            selectClause.getWordsList("key-list")[0].join("");
    }
    let filterClause = st.getTerm("filter-clause");
    if(filterClause.match) {
        opt.FilterExpression =
            filterClause.getWordsList("condition-expression")[0].join(" ");
    }
    let limitClause = st.getTerm("limit-clause");
    if(limitClause.match) {
        opt.Limit = limitClause.getWordsList("limit-count")[0].join(" ");
    }
    return opt;
// eslint-disable-next-line no-extra-semi
};
let source = `
    SELECT mainStar, orbitOrder, name
    FROM stars
    WHERE mainStar=:mainStar`;
let result = parseSqlishQuery(source);

console.log(`SOURCE:${source}
RESULT:${JSON.stringify(result, null, "    ")}`)
