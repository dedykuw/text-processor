function processData(data) {
    if (Array.isArray(data)) {
        data = data.join(' ');
    }
    return data
        .toLowerCase()
        .replace(/[^a-zA-Z0-9\u00C0-\u00FF]+/g, ' ')
        .split(' ')
        .filter(function(item) {
            return stopWords.indexOf(item) === -1;
        }).map(stem);
}

module.exports = processData;