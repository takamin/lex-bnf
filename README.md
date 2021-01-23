Lex-BNF
=======

<span class="display:inline-block;"> [![Build Status](https://travis-ci.org/takamin/lex-bnf.svg?branch=master)](https://travis-ci.org/takamin/lex-bnf)
[![Coverage Status](https://coveralls.io/repos/github/takamin/lex-bnf/badge.svg?branch=master)](https://coveralls.io/github/takamin/lex-bnf?branch=master)
![version](https://img.shields.io/npm/v/lex-bnf)
![license](https://img.shields.io/npm/l/lex-bnf)
</span>

This is a **general-purpose recursive descent parser and evaluator**.

Using this module, You can:

1. Defines a syntax rule such as programming languages, expressions, or structured statements.
1. Parses the code written based on the rules.
1. Evaluates the result of the parsing.

__NOTE: The class `BNF` exported in v0.3.3 is deprecated and it can be used as `Language.BNF`.__

Create A `Language` Definition
----

The parser is defined as an instance of `Language` class by using objects of BNF-like
notation and its evaluator functions. Those can run in dynamically and immediately.

The `Language` constructor takes one array of syntax rule.
To create the syntax rule, use `Language.syntax()` function.

__Paramters of `Language.syntax()`:__

1. A name of the syntax rule.
1. An array of a rule which is an array of terms.
    * A character '*' at the end of a rule name as an element of the terms is __Repetition Specifier__ that means the rule is repeatable.
    * See the rule declaration part of `additive-expression` in [sample/calc.js](https://github.com/takamin/lex-bnf/blob/master/sample/calc.js) to use the feature.
1. An evaluator function (optional). It can be omitted when the second parameter contains only one rule which containing only one other name of syntax rule.



Demo: Evaluating arithmetic expression
----

With following files, those shows how define a syntax of language.

* [sample/eval-expr.js](https://github.com/takamin/lex-bnf/blob/master/sample/eval-expr.js)  
A simple calculator script to parse and evaluate an expression from CLI.
* [sample/calc.js](https://github.com/takamin/lex-bnf/blob/master/sample/calc.js)  
An implementation of the calculator syntax.

__run on bash__

```bash
$ node sample/eval-expr.js '(1 + 2) * ((3 + 4) / 2)'
10.5
$
```

Documents
----

* [GitHub Pages](https://takamin.github.io/lex-bnf/)
* API Reference
    * [v1.1.0](https://takamin.github.io/lex-bnf/docs/lex-bnf/1.1.0/)
        * Repetition specifier `*` is available for the rule name. It is important for getting correct answer of multi term arithmetic expressions such as `1 - 2 - 3 = ?`.
    * [v1.0.1](https://takamin.github.io/lex-bnf/docs/lex-bnf/1.0.1/)
    * [v1.0.0](https://takamin.github.io/lex-bnf/docs/lex-bnf/1.0.0/)

LICENSE
-------

This software is released under the MIT License, see [LICENSE](LICENSE)
