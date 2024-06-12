'use strict'

const lodash = require('lodash');

function selector(object = {}, fields = []) {
    return lodash.pick(object, fields);
}

module.exports = {
  selector,
}