/**
 * Simple string tokenizer
 */
'use strict';
module.export = tokenizer;
function tokenizer(data) {
    if (Array.isArray(data)) {
        data = data.join(' ');
    }
    return data
        .split(' ')
};
