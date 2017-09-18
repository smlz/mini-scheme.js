/* eslint no-unused-vars: ["error", { "varsIgnorePattern": "_" }] */
/* eslint no-console: ["error", { allow: ["warn", "error"] }] */
/* global Vue */

(function() {

    function tokenize(text) {
        if (text.split("(").length !== text.split(")").length) {
            throw (SyntaxError("Parentheses missmatch."));
        }
        return text
            .replace(/\(/g, " ( ")
            .replace(/\)/g, " ) ")
            .replace(/;.*$/gm, "")
            .replace(/\n/g, " ")
            .split(" ")
            .filter(Boolean);
    }

    function parse(tokens) {
        if (tokens.length === 0) {
            throw SyntaxError("Enter code.");
        }

        var current = ["begin"];
        const stack = [current];

        for (let token of tokens) {
            if (token === "(") {
                let old = current;
                current = [];
                old.push(current);
                stack.push(current);
            } else if (token === ")") {
                if (stack.length === 1) {
                    throw (SyntaxError("Program ended prematurely."));
                }
                stack.pop();
                current = stack[stack.length - 1];
            } else {
                current.push(atom(token));
            }
        }
        if (stack.length > 1) {
            throw (SyntaxError("Program not finished.")); // Should not happen
        }
        return stack[0];
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
            const res = env[x];
            if (typeof res === "undefined") {
                throw Error("Variable '" + x + "' not found");
            }
            return env[x];
        } else if (typeof x === "number") {
            return x;
        } else if (x[0] === "if") {
            if (x.length != 4) {
                throw Error("Wrong number of arguments for if: " +
                    (x.length - 1) + " != 3");
            }
            const [_, test, conseq, alt] = x;
            const exp = evaluate(test, env) ? conseq : alt;
            return evaluate(exp, env);
        } else if (x[0] === "define") {
            if (x.length != 3) {
                throw Error("Wrong number of arguments for define: " +
                    (x.length - 1) + " != 2");
            }
            const [_, name, exp] = x;
            env[name] = evaluate(exp, env);
        } else if (x[0] === "lambda") {
            if (x.length != 3) {
                throw Error("Wrong number of arguments for lambda: " +
                    (x.length - 1) + " != 2");
            }
            const [_, arg_names, body] = x;
            if (!(arg_names instanceof Array)) {
                throw Error("Function arguments must be a list");
            }
            // Do nothing for now, except store the current environment
            // together with the function definition.
            return ["lambda", arg_names, body, env];
        } else {
            // Function call (no special form)
            const func_name = typeof x[0] === "string" ? x[0] : "<anon>";
            const [func, ...args] = x.map(exp => evaluate(exp, env));
            if (typeof func === "function") {
                // Native JavaScript function call
                return func(...args);
            } else if (func instanceof Array) {
                // MiniScheme function call
                const [_, arg_names, body, definition_env] = func;
                if (arg_names.length !== args.length) {
                    throw Error("Wrong number of arguments for function " +
                        func_name + ". " + args.length + " supplied, " +
                        arg_names.length + " needed.");
                }

                // Create a new function calling environment with the supplied
                // argument names and values. Link to the environment at
                // function definition as outer environment.
                const call_env = arg_names.reduce(function(env, name, i) {
                    env[name] = args[i];
                    return env;
                }, Object.create(definition_env));

                // Evaluate the function body with the newly created environment
                return evaluate(body, call_env);
            } else {
                throw Error("Invalid function: " + func_name);
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

    const vm = new Vue({
        el: "#app",
        data: {
            input: "",
            tokens: [],
            ast: [],
            env: {},
            global_env: global_env,
            result: undefined,
            error: false,
            debug: true
        },
        computed: {
            parenBalance: function() {
                return this.input.split("(").length -
                       this.input.split(")").length;
            }
        },
        watch: {
            input: function(val) {
                this.ast = [];
                this.result = undefined;
                this.error = false;
                try {
                    this.tokens = tokenize(val);
                    this.ast = parse(this.tokens.slice());
                    this.env = Object.create(this.global_env);
                    this.result = evaluate(this.ast, this.env);
                } catch (error) {
                    this.error = error.message;
                }
            }
        },
    });

    // Example input:
    vm.input = `(begin
    (define sqrt (lambda (x) (begin
        (define abs (lambda (a) (if (> a 0) x (- 0 a))))
        (define good_enough? (lambda (guess)
            (<= (abs (- x (* guess guess))) 0.000001)
        ))
        (define avg  (lambda (a b) (/ (+ a b) 2) ))
        (define sqrt_iter (lambda (guess)
            (if (good_enough? guess) guess (sqrt_iter (avg guess (/ x guess))))
        ))
        (sqrt_iter 1))))
    (sqrt 2))`;
}());
