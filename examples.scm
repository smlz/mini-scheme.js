; Simple closure
(begin
  (define make_adder (lambda (x) (lambda (y) (+ x y))))
  ((make_adder 4) 3)
)

; Calculate square roots (sqrt)
(begin
  (define abs (lambda (x) (if (> x 0) x (- 0 x))))
  (define good_enough? (lambda (x guess)
    (<= (abs (- x (* guess guess))) 0.0001)
  ))
  (define avg  (lambda (a b) (/ (+ a b) 2) ))
  (define sqrt_iter (lambda (x guess)
     (if (good_enough? x guess) guess (sqrt_iter x (avg guess (/ x guess))))
  ))
  (define sqrt (lambda (x) (sqrt_iter x 1)))
  (sqrt 2)
)

; sqrt, hiding internals and using closures
(begin
    (define sqrt (lambda (x) (begin
        (define abs (lambda (a) (if (> a 0) x (- 0 a))))
        (define good_enough? (lambda (guess)
            (<= (abs (- x (* guess guess))) 0.000001)
        ))
        (define avg  (lambda (a b) (/ (+ a b) 2) ))
        (define sqrt_iter (lambda (guess)
            (if (good_enough? guess) guess (sqrt_iter (avg guess (/ x guess))))
        ))
        (sqrt_iter 1)
    )))
    (sqrt 2)
)

; sqrt: iife
((lambda (x)
    (begin
        (define abs (lambda (a) (if (> a 0) x (- 0 a))))
        (define good_enough?
            (lambda (guess)
                (<= (abs (- x (* guess guess))) 0.000001)))
        (define avg  (lambda (a b) (/ (+ a b) 2) ))
        (define sqrt_iter
            (lambda (guess)
                (if (good_enough? guess)
                    guess
                    (sqrt_iter (avg guess (/ x guess))))))
        (sqrt_iter 1))
) 2)
