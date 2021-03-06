'use strict';

/*
* MODEL
*/

(function makeModel() {
  /**
  * evaluateSubtotal() passes the current input through all mathematical
  * function expressions that are of equal or higher precedence than
  * the most recent user-selected mathematical operator.
  * if higher-precedence functions do not contain any outstanding
  * expression(s) waiting to be evaluated, they simply return the input.
  *
  * This setup allows the calculator to follow the order of operations by
  * suspending lower-precedence operators and their operands within curried
  * functions, to be evaluated once higher-precedence operations are complete.
  * It also allows for the display of alternative subtotals
  * in the event that the user consecutively selects different operators.
  */
  function evaluateSubtotal() {
    if (this.operator.isLowPrecedence()) {
      this.subtotal.set(this.lowPrecedenceExpression.evaluate(this.midPrecedenceExpression.evaluate(this.highPrecedenceExpression.evaluate(this.input.get()))));
    } else if (this.operator.isMidPrecedence()) {
      this.subtotal.set(this.midPrecedenceExpression.evaluate(this.highPrecedenceExpression.evaluate(this.input.get())));
    } else if (this.operator.isHighPrecedence()) {
      this.subtotal.set(this.highPrecedenceExpression.evaluate(this.input.get()));
    }
  }

  /**
  * setVariables() passes the current subtotal to the appropriate
  * function expression (based on the most recent user-selected operator),
  * resets all higher-precedence function expressions,
  * and resets operator and input values
  */
  function setVariables() {
    if (this.operator.isNotDefined()) {
      return;
    } else if (this.operator.isLowPrecedence()) {
      this.lowPrecedenceExpression.partialApply(this.subtotal.get(), this.operator.get());
      this.midPrecedenceExpression.reset();
      this.highPrecedenceExpression.reset();
    } else if (this.operator.isMidPrecedence()) {
      this.midPrecedenceExpression.partialApply(this.subtotal.get());
      this.highPrecedenceExpression.reset();
    } else if (this.operator.isHighPrecedence()) {
      this.highPrecedenceExpression.partialApply(this.subtotal.get());
    }
    this.operator.reset();
    this.input.reset();
  }

  function evaluateTotal() {
    this.input.setToSubtotal.call(this);
    this.lowPrecedenceExpression.reset();
    this.midPrecedenceExpression.reset();
    this.highPrecedenceExpression.reset();
    this.operator.set('=');
  }

  function clearAfterEquals() {
    var lastButtonPressedWasEquals = this.operator.get() === '=';

    if (lastButtonPressedWasEquals) {
      this.input.reset();
      this.subtotal.reset();
    }
  }

  function clear() {
    this.input.reset();
    this.lowPrecedenceExpression.reset();
    this.midPrecedenceExpression.reset();
    this.highPrecedenceExpression.reset();
    this.operator.reset();
    this.subtotal.reset();
  }

  function round(number) {
    var isExponentialForm = /e/.test('' + number);
    var isNegativeDecimal = /\./.test('' + number) && /^-/.test('' + number);
    var isPositiveDecimal = /\./.test('' + number);
    var negPlaces = 10 - ('' + number).indexOf('.');
    var posPlaces = 9 - ('' + number).indexOf('.');

    if (isExponentialForm) {
      return number;
    } else if (isNegativeDecimal) {
      return +(Math.round(number + 'e' + negPlaces) + 'e-' + negPlaces);
    } else if (isPositiveDecimal) {
      return +(Math.round(number + 'e' + posPlaces) + 'e-' + posPlaces);
    }
    return number;
  }

  function buildInput(char) {
    var charIsDecimal = char === '.';
    var charIsSign = char === 'sign';

    if (charIsSign) {
      this.input.changeSign();
    } else if (!this.input.hasDecimal() && charIsDecimal || !charIsDecimal) {
      this.input.addCharEnd(char);
      this.input.trimLeadingZeros();
    }
  }

  function subtotalModule() {
    var subtotal = void 0;

    function get() {
      return subtotal;
    }
    function set(number) {
      subtotal = round(number);
    }
    function reset() {
      subtotal = undefined;
    }
    return { get: get, set: set, reset: reset };
  }

  function inputModule() {
    var input = '0';

    function get() {
      return input;
    }
    function setToSubtotal() {
      input = '' + this.subtotal.get();
    }
    function reset() {
      input = '0';
    }
    // only want the count of numbers, not the entire string length
    function isNotMaxLength() {
      return input.match(/\d/g).length < 9;
    }
    function addCharEnd(char) {
      if (isNotMaxLength()) input += char;
    }
    function isPositive() {
      return !/-/.test(input);
    }
    function changeSign() {
      input = isPositive() ? '-' + input : input.substring(1);
    }
    function hasDecimal() {
      return (/\./.test(input)
      );
    }
    function hasPositiveLeadingZero() {
      return (/^0/.test(input)
      );
    }
    function hasNegativeLeadingZero() {
      return (/^-0/.test(input) && input.length > 2
      );
    }
    function trimLeadingZeros() {
      if (hasPositiveLeadingZero() && !hasDecimal()) {
        input = input.substring(1);
      } else if (hasNegativeLeadingZero() && !hasDecimal()) {
        input = '-' + input.substring(2);
      }
    }
    return {
      get: get,
      setToSubtotal: setToSubtotal,
      reset: reset,
      addCharEnd: addCharEnd,
      isNotMaxLength: isNotMaxLength,
      changeSign: changeSign,
      isPositive: isPositive,
      trimLeadingZeros: trimLeadingZeros,
      hasDecimal: hasDecimal,
      hasPositiveLeadingZero: hasPositiveLeadingZero,
      hasNegativeLeadingZero: hasNegativeLeadingZero
    };
  }

  function operatorModule() {
    var operator = '';

    function get() {
      return operator;
    }
    function reset() {
      operator = '';
    }
    function set(symbol) {
      operator = symbol;
    }
    function isLowPrecedence() {
      return operator === '+' || operator === '-' || !operator;
    }
    function isMidPrecedence() {
      return operator === '/';
    }
    function isHighPrecedence() {
      return operator === '*';
    }
    function isNotDefined() {
      return !operator;
    }
    return {
      get: get,
      set: set,
      reset: reset,
      isLowPrecedence: isLowPrecedence,
      isMidPrecedence: isMidPrecedence,
      isHighPrecedence: isHighPrecedence,
      isNotDefined: isNotDefined
    };
  }

  var OPERATORS = {
    '+': function _(a, b) {
      return a + b;
    },
    '-': function _(a, b) {
      return a - b;
    },
    '*': function _(a, b) {
      return a * b;
    },
    '/': function _(a, b) {
      return a / b;
    }
  };

  function expressionModule(defaultOperator) {
    // default expression simply returns input value as number
    var expression = function expression(a) {
      return +a;
    };

    function evaluate(value) {
      return expression(value);
    }
    function reset() {
      expression = function expression(a) {
        return +a;
      };
    }
    /*
    * partialApply() fixes an operator and an operand which wait until
    * a second operand is provided to evaluate the expression.
    */
    function partialApply(firstValue) {
      var operator = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : defaultOperator;

      expression = function expression(secondValue) {
        return round(OPERATORS[operator](firstValue, secondValue));
      };
    }
    return { evaluate: evaluate, reset: reset, partialApply: partialApply };
  }

  // App namespace
  window.calculatorMVC = {};

  window.calculatorMVC.model = {
    evaluateSubtotal: evaluateSubtotal,
    setVariables: setVariables,
    evaluateTotal: evaluateTotal,
    clearAfterEquals: clearAfterEquals,
    clear: clear,
    round: round,
    buildInput: buildInput,
    input: inputModule(),
    subtotal: subtotalModule(),
    operator: operatorModule(),
    lowPrecedenceExpression: expressionModule(),
    midPrecedenceExpression: expressionModule('/'),
    highPrecedenceExpression: expressionModule('*'),
    OPERATORS: OPERATORS
  };
})();

/*
* VIEW
*/

(function makeView() {
  function display(number) {
    document.querySelector('#display').textContent = this.formatNumber(number);
  }

  function formatNumber(number) {
    var error = number === 'NaN' || number === 'Infinity';
    var string = '' + number;
    var excedesThresholds = Math.abs(+string) > 999999999 || Math.abs(+string) < 0.000001 && Math.abs(+string) > 0;

    if (error) {
      return 'Error';
    }
    return excedesThresholds ?

    // format for better-looking exponential notation
    ('' + (+string).toExponential(5)).replace(/\.*0*e/, 'e').replace(/\+/, '')

    // format to add thousands commas, but not in decimal places, obviously
    : string.split('.')[0].replace(/(\d)(?=(\d\d\d)+(?!\d))/g, '$1,') + (/\./.test(string) && '.' || '') + (string.split('.')[1] || '');
  }

  function respondToOrientation() {
    var shouldBeLandscape = window.matchMedia('(orientation: landscape)').matches && window.innerWidth <= 1024;

    // maintains a portrait orientation on wide laptop/desktop screens
    var shouldBePortrait = window.matchMedia('(orientation: portrait)').matches || window.innerWidth > 1024;

    if (shouldBeLandscape) {
      this.setShellSize(1.5, '25vh', '16.66%', '100%');
      document.querySelector('#clear').textContent = 'cl';
    } else if (shouldBePortrait) {
      this.setShellSize(0.666, '16.66vh', '25%', '33.33%');
      document.querySelector('#clear').textContent = 'clear';
    }
  }

  // obsessive attempt to maintain circular buttons in a rectangular grid
  function setShellSize(ratio, paddingAll, paddingDisplay, paddingClear) {
    var calculator = document.querySelector('.calculator');
    var buttonShells = document.querySelectorAll('.button-shell');
    var excedesRatio = calculator.offsetWidth > ratio * calculator.offsetHeight;

    if (excedesRatio) {
      // cant use normal forEach() method because not supported by MSEdge
      Array.prototype.forEach.call(buttonShells, function (item) {
        item.style.paddingTop = paddingAll;
      });
    } else {
      Array.prototype.forEach.call(buttonShells, function (item) {
        if (item.id === 'display-shell') {
          item.style.paddingTop = paddingDisplay;
        } else if (item.id === 'clear-shell') {
          item.style.paddingTop = paddingClear;
        } else {
          item.style.paddingTop = '100%';
        }
      });
    }
  }

  function animateButton(target) {
    target.classList.add('animate');
    setTimeout(function () {
      target.classList.remove('animate');
    }, 100);
  }

  function removeButtonOutline() {
    Array.prototype.forEach.call(document.querySelectorAll('.button'), function (item) {
      item.classList.remove('outline');
    });
  }

  function outlineButton(target) {
    target.classList.add('outline');
  }

  window.calculatorMVC.view = {
    display: display,
    formatNumber: formatNumber,
    respondToOrientation: respondToOrientation,
    setShellSize: setShellSize,
    animateButton: animateButton,
    outlineButton: outlineButton,
    removeButtonOutline: removeButtonOutline
  };
})();

/*
* CONTROLLER
*/

(function makeController(model, view) {
  var NUM_KEY_MAP = {
    0: 'zero',
    1: 'one',
    2: 'two',
    3: 'three',
    4: 'four',
    5: 'five',
    6: 'six',
    7: 'seven',
    8: 'eight',
    9: 'nine',
    '.': 'decimal'
  };
  var OPERATOR_KEY_MAP = {
    '/': 'divide',
    '*': 'multiply',
    '+': 'add',
    '-': 'subtract',
    Divide: 'divide',
    Multiply: 'multiply',
    Add: 'add',
    Subtract: 'subtract'
  };
  var OTHER_KEY_MAP = {
    Enter: 'equals',
    Delete: 'clear',
    Del: 'clear'
  };

  function initialize() {
    view.display(model.input.get());
    view.respondToOrientation();
    this.setupListeners();
  }

  function viewTasks(display, target) {
    view.display(display);
    view.animateButton(target);
    view.removeButtonOutline();
  }

  // numbersHandler() called every time user selects a number
  function numbersHandler(e) {
    var keyTarget = document.querySelector('#' + this.NUM_KEY_MAP[e.key]);
    var char = e.key || e.target.dataset.content;

    // clearAfterEquals does nothing unless last user selection was '='
    model.clearAfterEquals();
    // setVariables() does nothing unless last user selection was an operator
    model.setVariables();
    model.buildInput(char);

    this.viewTasks(model.input.get(), keyTarget || e.target);
  }

  // operatorsHandler() called every time user selects a mathematical operator
  function operatorsHandler(e) {
    var keyTarget = document.querySelector('#' + this.OPERATOR_KEY_MAP[e.key]);

    model.operator.set(keyTarget && keyTarget.dataset.operator || e.target.dataset.operator);

    model.evaluateSubtotal();
    this.viewTasks(model.subtotal.get(), keyTarget || e.target);
    view.outlineButton(keyTarget || e.target);
  }

  function equalsHandler(e) {
    var keyTarget = document.querySelector('#' + this.OTHER_KEY_MAP[e.key]);

    model.evaluateSubtotal();
    model.evaluateTotal();
    this.viewTasks(model.input.get(), keyTarget || e.target);
    view.outlineButton(keyTarget || e.target);
  }

  function clearHandler(e) {
    var keyTarget = document.querySelector('#' + this.OTHER_KEY_MAP[e.key]);

    model.clear();
    this.viewTasks(model.input.get(), keyTarget || e.target);
  }

  function setupListeners() {
    var _this = this;

    window.addEventListener('keydown', function (e) {
      if (_this.NUM_KEY_MAP[e.key]) {
        _this.numbersHandler(e);
      } else if (_this.OPERATOR_KEY_MAP[e.key]) {
        _this.operatorsHandler(e);
      } else if (e.key === 'Enter') {
        _this.equalsHandler(e);
      } else if (_this.OTHER_KEY_MAP[e.key] && e.key !== 'Enter') {
        _this.clearHandler(e);
      }
    });
    Array.prototype.forEach.call(document.querySelectorAll('.number'), function (item) {
      item.addEventListener('click', _this.numbersHandler.bind(_this));
    }, this);

    Array.prototype.forEach.call(document.querySelectorAll('.operator'), function (item) {
      item.addEventListener('click', _this.operatorsHandler.bind(_this));
    }, this);

    document.querySelector('#equals').addEventListener('click', this.equalsHandler.bind(this));

    document.querySelector('#clear').addEventListener('click', this.clearHandler.bind(this));

    window.addEventListener('resize', view.respondToOrientation.bind(view));
  }

  window.calculatorMVC.controller = {
    NUM_KEY_MAP: NUM_KEY_MAP,
    OPERATOR_KEY_MAP: OPERATOR_KEY_MAP,
    OTHER_KEY_MAP: OTHER_KEY_MAP,
    initialize: initialize,
    viewTasks: viewTasks,
    numbersHandler: numbersHandler,
    operatorsHandler: operatorsHandler,
    equalsHandler: equalsHandler,
    clearHandler: clearHandler,
    setupListeners: setupListeners
  };
})(window.calculatorMVC.model, window.calculatorMVC.view);

/*
* INITIALIZE
*/

window.calculatorMVC.controller.initialize();