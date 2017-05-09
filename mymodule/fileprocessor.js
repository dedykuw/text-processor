const fs = require('fs');
const path = require('path');
const es = require('event-stream');
const stripTags = require('striptags');
const stopWords = require('./stopwords');
const Stem = require('./stem');
var dir = require('node-dir');
var events = require('events');

function FileProcessor(){
    events.EventEmitter.call(this);
    this.index = {};
}
FileProcessor.prototype.__proto__ = events.EventEmitter.prototype;
FileProcessor.prototype.textProcessor = function (data,config) {
        if (config.caseFolding){
            data = data.toLowerCase()
        }else if(config.escapeCharacter) {
            data = data.replace(/[^a-zA-Z0-9\u00C0-\u00FF]+/g, ' ').split(' ');
        }else if(config.stopword){
            data = data.filter(function(item) {
                return stopWords.indexOf(item) === -1;
            })
        }else if(config.stem){
            data = data.map(Stem)
        }
        return data;
};

FileProcessor.prototype.create = function(pathToFile,outputDir,config,cb){
    var returnTxt = '';
    var docIndex = 0;
    this.clearIndex(outputDir);
    var splitter = fs.createReadStream(pathToFile)
        .pipe(es.split())
        .pipe(es.mapSync(
            function(line){

                // pause the readstream
                splitter.pause();
                if (/WARC\/0.18/g.test(line)) {
                    const wr = fs.createWriteStream(path.join(outputDir, docIndex.toString()));
                    var tagsFree = this.textProcessor(stripTags(returnTxt),config);
                    wr.write(tagsFree);
                    wr.close()
                    docIndex = docIndex+1;
                    returnTxt = '';
                };
                returnTxt +=line;

                // resume the readstream, possibly from a callback
                splitter.resume();
            }.bind(this))
                .on('end', function(){
                    console.log('create posting list success');
                    cb();
            })
        );
};
FileProcessor.prototype.clearIndex = function (outputDir) {
    dir.files(outputDir, function(err, files) {
        if (err) throw err;
        files.forEach(function (file) {
            fs.unlink(file, function(err){
                if (err) throw err;
            });
        })
    });
};
FileProcessor.prototype.makeIndex = function (dirname,outputIndex) {
    var _this = this
    dir.readFiles(dirname, function(err, content, filename, next) {
        var docIndex = parseInt(path.basename(filename))
        content
            .split(' ')
            .forEach(function(item,itemIndex) {
                if (!_this.index.hasOwnProperty(item)) {
                    _this.index[item] = {
                        term : item,
                        df : 1,
                        postingList : [{
                            doc : docIndex,
                            tf  : 1,
                            oc  : [itemIndex]
                        }]
                    };
                } else {
                    _this.index[item].df += 1;
                    var exist = _this.index[item].postingList.filter(function (post) {
                      return post.doc == docIndex;
                    });
                    if (exist.length){
                        var currIndex = _this.index[item].postingList.findIndex(
                            function(post){
                                return post.doc == docIndex
                            });
                        _this.index[item].postingList[currIndex].tf +=1;
                        _this.index[item].postingList[currIndex].oc.push(itemIndex);
                    }else {
                        _this.index[item].postingList.push({
                            doc : docIndex,
                            tf  : 1,
                            oc  : [itemIndex]
                        })
                    }
                }
            });
        next();
    },function (err,files) {
        const writeIndex = fs.createWriteStream(outputIndex);
        for (var term in _this.index) {
            if (_this.index.hasOwnProperty(term)) {
                var text = `${ _this.index[term].term }, ${ _this.index[term].df } : \n <${ _this.postingListParser(_this.index[term].postingList) }> \n`;
                writeIndex.write(text)
            }

        }
        _this.emit('finish');
    });
};
FileProcessor.prototype.postingListParser = function (postinglist) {
    var text = ``;
    postinglist.forEach(function (val,index) {
        text += `${val.doc},${val.tf} :   <${val.oc.join()} > \n`
    })
    return text;
}


module.exports = FileProcessor;
