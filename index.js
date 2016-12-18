/**
 * `list` type prompt
 */

var _ = require('lodash');
var util = require('util');
var chalk = require('chalk');
var cliCursor = require('cli-cursor');
var figures = require('figures');
var Base = require("inquirer/lib/prompts/base");
var observe = require("inquirer/lib/utils/events");
var Paginator = require("inquirer/lib/utils/paginator");
var Separator = require('inquirer/lib/objects/separator');
/**
 * Module exports
 */

module.exports = Prompt;

/**
 * Constructor
 */


function Prompt() {
    Base.apply(this, arguments);

    if (!this.opt.choices) {
        this.throwParamError('choices');
    }

    if (_.isArray(this.opt.default)) {
        this.opt.choices.forEach(function(choice) {
            if (this.opt.default.indexOf(choice.value) >= 0) {
                choice.checked = true;
            }
        }, this);
    }

    this.pointer = 0;

    // Make sure no default is set (so it won't be printed)
    this.opt.default = null;

    this.paginator = new Paginator();
}
util.inherits(Prompt, Base);

/**
 * Start the Inquiry session
 * @param  {Function} cb      Callback when prompt is done
 * @return {this}
 */

Prompt.prototype._run = function(cb) {
    this.done = cb;

    var events = observe(this.rl);

    var normalizedLeftKey = events.keypress.filter(function (e) {
      return e.key.name === 'left' || ( e.key.name === 'h');
    }).share();

    var normalizedRightKey = events.keypress.filter(function (e) {
      return e.key.name === 'right' || ( e.key.name === 'l');
    }).share();

    var validation = this.handleSubmitEvents(
        events.line.map(this.getCurrentValue.bind(this))
    );
    validation.success.forEach(this.onEnd.bind(this));
    validation.error.forEach(this.onError.bind(this));

    events.normalizedUpKey.takeUntil(validation.success).forEach(this.onUpKey.bind(this));
    events.normalizedDownKey.takeUntil(validation.success).forEach(this.onDownKey.bind(this));
    events.numberKey.takeUntil(validation.success).forEach(this.onNumberKey.bind(this));
    events.spaceKey.takeUntil(validation.success).forEach(this.onSpaceKey.bind(this));
    events.aKey.takeUntil(validation.success).forEach(this.onAllKey.bind(this));
    events.iKey.takeUntil(validation.success).forEach(this.onInverseKey.bind(this));
    normalizedLeftKey.takeUntil(validation.success).forEach(this.orderUp.bind(this));
    normalizedRightKey.takeUntil(validation.success).forEach(this.orderDown.bind(this));
    // Init the prompt
    cliCursor.hide();
    this.render();

    return this;
};

/**
 * Render the prompt to screen
 * @return {Prompt} self
 */

Prompt.prototype.render = function(error) {
    // Render question
    var message = this.getQuestion();
    var bottomContent = '';

    if (!this.spaceKeyPressed) {
        message += '(Press ' + chalk.cyan.bold('<space>') + ' to select, ' + chalk.cyan.bold('<a>') + ' to toggle all, ' + chalk.cyan.bold('<i>') + ' to inverse selection, ' + chalk.cyan.bold('<left>') + ' to move entry up, ' + chalk.cyan.bold('<right>') + ' to move entry down)';
    }

    // Render choices or answer depending on the state
    if (this.status === 'answered') {
        message += chalk.cyan(this.selection.join(', '));
    } else {
        var choicesStr = renderChoices(this.opt.choices, this.pointer);
        var indexPosition = this.opt.choices.indexOf(this.opt.choices.getChoice(this.pointer));
        message += '\n' + this.paginator.paginate(choicesStr, indexPosition, this.opt.pageSize);
    }

    if (error) {
        bottomContent = chalk.red('>> ') + error;
    }

    this.screen.render(message, bottomContent);
};

/**
 * When user press `enter` key
 */

Prompt.prototype.onEnd = function(state) {
    this.status = 'answered';

    // Rerender prompt (and clean subline error)
    this.render();

    this.screen.done();
    cliCursor.show();
    this.done(state.value);
};

Prompt.prototype.onError = function(state) {
    this.render(state.isValid);
};

Prompt.prototype.getCurrentValue = function() {
    var choices = this.opt.choices.filter(function(choice) {
        return Boolean(choice.checked) && !choice.disabled;
    });

    this.selection = _.map(choices, 'short');
    return _.map(choices, 'value');
};

Prompt.prototype.onUpKey = function() {
    var len = this.opt.choices.realLength;
    this.pointer = (this.pointer > 0) ? this.pointer - 1 : len - 1;
    this.render();
};

Prompt.prototype.onDownKey = function() {
    var len = this.opt.choices.realLength;
    this.pointer = (this.pointer < len - 1) ? this.pointer + 1 : 0;
    this.render();
};

Prompt.prototype.onNumberKey = function(input) {
    if (input <= this.opt.choices.realLength) {
        this.pointer = input - 1;
        this.toggleChoice(this.pointer);
    }
    this.render();
};

Prompt.prototype.onSpaceKey = function() {
    this.spaceKeyPressed = true;
    this.toggleChoice(this.pointer);
    this.render();
};

Prompt.prototype.onAllKey = function() {
    var shouldBeChecked = Boolean(this.opt.choices.find(function(choice) {
        return choice.type !== 'separator' && !choice.checked;
    }));

    this.opt.choices.forEach(function(choice) {
        if (choice.type !== 'separator') {
            choice.checked = shouldBeChecked;
        }
    });

    this.render();
};

Prompt.prototype.onInverseKey = function() {
    this.opt.choices.forEach(function(choice) {
        if (choice.type !== 'separator') {
            choice.checked = !choice.checked;
        }
    });

    this.render();
};

Prompt.prototype.toggleChoice = function() {
    var item = this.opt.choices.getChoice(this.pointer);
    if (item !== undefined) {
        item.checked = !item.checked;
    }
    this.render();
};

Prompt.prototype.orderDown = function() {
  var a = this.pointer;
  var b = this.pointer + 1;
  var prevItem = this.opt.choices.getChoice(a);
  var item = this.opt.choices.getChoice(b);
  if ((item !== undefined) && (prevItem !== undefined)) {

      this.opt.choices.choices[a] = item;
      this.opt.choices.choices[b] = prevItem;
      this.opt.choices.push()
      this.pointer = b;
        // this.pointer = b
  }

    this.render();
};
Prompt.prototype.orderUp = function() {
  var a = this.pointer;
  var b = this.pointer - 1;
  var prevItem = this.opt.choices.getChoice(a);
  var item = this.opt.choices.getChoice(b);
  if ((item !== undefined) && (prevItem !== undefined)) {

      this.opt.choices.choices[a] = item;
      this.opt.choices.choices[b] = prevItem;
      this.opt.choices.push()
      this.pointer = b;
        // this.pointer = b
  }

    this.render();
};

/**
 * Function for rendering checkbox choices
 * @param  {Number} pointer Position of the pointer
 * @return {String}         Rendered content
 */

function renderChoices(choices, pointer) {
    var output = '';
    var separatorOffset = 0;

    choices.forEach(function(choice, i) {
        if (choice.type === 'separator') {
            separatorOffset++;
            output += ' ' + choice + '\n';
            return;
        }

        if (choice.disabled) {
            separatorOffset++;
            output += ' - ' + choice.name;
            output += ' (' + (_.isString(choice.disabled) ? choice.disabled : 'Disabled') + ')';
        } else {
            var isSelected = (i - separatorOffset === pointer);
            output += isSelected ? chalk.cyan(figures.pointer) : ' ';
            output += getCheckbox(choice.checked) + ' ' + choice.name;
        }

        output += '\n';
    });

    return output.replace(/\n$/, '');
}

/**
 * Get the checkbox
 * @param  {Boolean} checked - add a X or not to the checkbox
 * @return {String} Composited checkbox string
 */

function getCheckbox(checked) {
    return checked ? chalk.green(figures.radioOn) : figures.radioOff;
}