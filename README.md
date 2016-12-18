# inquirer-orderedcheckbox

Inquirer extension that allows a list to be ordered and selected.

## License

The License information is available in license.txt

## Installation

```
npm install --save inquirer-orderedcheckbox
```

## Usage

This prompt is anonymous, meaning you can register this prompt with the type name you please:

```javascript
inquirer.registerPrompt('orderedcheckbox', require('inquirer-orderedcheckbox'));
inquirer.prompt({
  type: 'orderedcheckbox',
  ...
})
```

### Options

Takes `type`, `name`, `message`, `validate`, `choices` properties.

See [inquirer](https://github.com/SBoudrias/Inquirer.js) readme for meaning of all

#### Example

```javascript
inquirer.registerPrompt('directory', require('inquirer-directory'));
inquirer.prompt([
  {
    type: 'orderedCheckbox',
    message: 'Select toppings',
    name: 'toppings',
    choices: [
      {
        name: 'Pepperoni'
      },
      {
        name: 'Ham'
      },
      {
        name: 'Ground Meat'
      },
      {
        name: 'Bacon'
      },
      {
        name: 'Extra cheese'
      }
    ],
    validate: function (answer) {
      if (answer.length < 1) {
        return 'You must choose at least one topping.';
      }
      return true;
    }
  }
]).then(function (answers) {
  console.log(JSON.stringify(answers, null, '  '));
});
```
###Thanks
Thanks to https://github.com/nicksrandall/inquirer-directory for the information on how to produce this plugin.  
