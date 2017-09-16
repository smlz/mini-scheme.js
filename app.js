/* eslint no-unused-vars: ["error", { "varsIgnorePattern": "_" }] */
/* global Vue */

(function() {

    function tokenize(text) {
        return text.replace(/\(/g, " ( ").replace(/\)/g, " ) ").replace(/\n/g, " ").split(" ").filter(Boolean);
    }

    function parse(tokens) {
        if (tokens.length === 0) {
            throw SyntaxError("Unexpected EOF while reading");
        }
        var token = tokens.shift();
        if (token === "(") {
            var list = [];
            while (tokens[0] !== ")") {
                list.push(parse(tokens));
            }
            tokens.shift();
            return list;
        } else if (token === ")") {
            throw SyntaxError("Unexpected )");
        } else {
            return atom(token);
        }
    }

    function atom(token) {
        var number = parseFloat(token);
        if (isNaN(number)) {
            return token;
        } else {
            return number;
        }
    }

    const global_env = {
        "+": (a, b) => a + b,
        "-": (a, b) => a - b,
        "*": (a, b) => a * b,
        "/": (a, b) => a / b,
        "begin": (...args) => args[args.length - 1]
    };

    function evaluate(x, env=global_env) {
        if (typeof x === "string") {
            return env[x];
        } else if (typeof x === "number") {
            return x;
        } else if (x[0] === "if") {
            const [_, test, conseq, alt] = x;
            const exp = evaluate(test, env) ? conseq : alt;
            return evaluate(exp, env);
        } else if (x[0] === "define") {
            const [_, name, exp] = x;
            env[name] = evaluate(exp, env);
        } else if (x[0] === "func") {
            let [_, params, body] = x;
            return ["func", params, body, env];  // Nothing to do for now
        } else {
            let [func, ...args] = x;
            func = evaluate(func, env);
            args = args.map(arg => evaluate(arg, env));
            if (typeof func === "function") {
                return func(...args);
            } else {
                let [_, params, body, env] = func;
                let new_env = params.reduce(function(env, name, i) {
                    env[name] = args[i];
                    return env;
                }, Object.create(env));
                return evaluate(body, new_env);
            }
        }
    }

    Vue.component("item", {
        template: "#item-template",
        props: ["model"],
        computed: {
            isList: function() {
                return this.model instanceof Array;
            }
        },
    });

    new Vue({
        el: "#app",
        data: {
            input: "(begin\n  (define make_adder (func (x) (func (y) (+ x y))))\n  ((make_adder 4) 3)\n)"
        },
        computed: {
            tokens: function() {
                return tokenize(this.input);
            },
            ast: function() {
                return parse(this.tokens);
            },
            result: function() {
                return evaluate(this.ast);
            }
        },
    });

})();
