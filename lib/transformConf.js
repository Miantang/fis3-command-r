var fs = require('fs')
var _ = fis.util
var operators = ['mock', 'replace', 'defaultMode']

var config = {
    mockRule:{},
    replaceReg: /(\{%\s*block\s*name\=[\"|\']top-head-extend[\"|\']%\})((?:(?!\{%\/\s*block).|\n)*)(\{%\/\s*block\s*%\})/g,
    defaultMode: 1
}

function transformConf () {
    var conf = fs.existsSync('rapx-mock.conf') ? fs.readFileSync('rapx-mock.conf').toString() : ''
    var lines = conf.split('\n')
    for(var i = 0, len = lines.length; i < len; i++) {
        var quoteIndex = lines[i].indexOf('#')
        var lineString = quoteIndex === -1 ? lines[i] : lines[i].slice(0, quoteIndex) //去除 # 后面的所有字符
        lineString = _.trim(lineString)
        if(!lineString) continue;

        var rules = lineString.split(/\s+/)
        if(~operators.indexOf(rules[0])) {
            switch(rules[0]) {
                case 'mock':
                    config.mockRule[rules[1]] = rules.slice(2).join(' ');
                    break;
                case 'replace':
                    config.replaceReg = new RegExp(rules[1], 'g');
                    break;
                case 'defaultMode':
                    config.defaultMode = +rules[1]
                    break;
            }
        }
    }

    return config
}

module.exports = transformConf
