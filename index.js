const path = require('path');
const FileReader = require('./mymodule/fileprocessor')
const prompt = require('prompt');

const config = {
    caseFolding : 0,
    escapeCharacter : 0,
    stopword : 0,
    stem : 0
};



var schema = {
    properties: {

        fileName: {
            message: 'Filename ',
            required: true
        },
        caseFolding: {
            message: 'Use case folding (use = 1, no = 0) : ',
            required: true
        },
        escapeCharacter: {
            message: 'Use escape character (use = 1, no = 0) : ',
            required: true
        },
        stopword: {
            message: 'Use Stopword (use = 1, no = 0) : ',
            required: true
        },
        stem: {
            message: 'Use stemming (use = 1, no =0) : ',
            required: true
        }
    }
};

//
// Start the prompt
//
prompt.start();

prompt.get(schema, function (err, result) {
    config.caseFolding = parseInt(result.caseFolding);
    config.escapeCharacter = parseInt(result.escapeCharacter);
    config.stopword = parseInt(result.stopword);
    config.stem = parseInt(result.stem);


    var fr = new FileReader();
    fr.create(path.join(__dirname, 'source', result.fileName),path.join(__dirname, 'output'),config,function () {
        fr.makeIndex(path.join(__dirname, 'output'),path.join(__dirname,'output','index.txt'))
    });
    fr.on('finish',function () {
        console.log('finish')
    })
});