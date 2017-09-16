/* eslint no-unused-vars: ["error", { "varsIgnorePattern": "_" }] */
/* eslint no-console: ["error", { allow: ["warn", "error"] }] */
/* global Vue */

(function() {

    function tokenize(text) {
        return text
            .replace(/\(/g, " ( ")
            .replace(/\)/g, " ) ")
            .replace(/--.*$/gm, "")
            .replace(/\n/g, " ")
            .split(" ")
            .filter(Boolean);
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
        "=": (a, b) => a === b,
        "!=": (a, b) => a !== b,
        ">": (a, b) => a > b,
        ">=": (a, b) => a >= b,
        "<": (a, b) => a < b,
        "<=": (a, b) => a <= b,
        "begin": (...args) => args[args.length - 1]
    };

    function evaluate(x, env) {
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
        } else if (x[0] === "lambda") {
            const [_, arg_names, body] = x;
            // Do nothing for now, except store the current environment
            // together with the function definition.
            return ["lambda", arg_names, body, env];
        } else {
            // Function call (no special form)
            const [func, ...args] = x.map(exp => evaluate(exp, env));
            if (typeof func === "function") {
                // Native JavaScript function call
                return func(...args);
            } else {
                // MiniScheme function call
                const [_, arg_names, body, definition_env] = func;

                // Create a new function calling environment with the supplied
                // argument names and values. Link to the environment at
                // function definition as outer environment.
                const call_env = arg_names.reduce(function(env, name, i) {
                    env[name] = args[i];
                    return env;
                }, Object.create(definition_env));

                // Evaluate the function body with the newly created environment
                return evaluate(body, call_env);
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
            input: "(begin\n" +
                   "  (define make_adder (lambda (x) (lambda (y) (+ x y))))\n" +
                   "  ((make_adder 4) 3)\n" +
                   ")"
        },
        computed: {
            tokens: function() {
                return tokenize(this.input);
            },
            ast: function() {
                return parse(this.tokens);
            },
            result: function() {
                return evaluate(this.ast, Object.create(global_env));
            }
        },
    });

})();
