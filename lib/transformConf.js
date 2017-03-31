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
        var lineString = _.trim(lines[i])
        if (!/^#.*/.test(lineString) ) { //去除以 # 开头的注释行
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
    }

    return config
}

module.exports = transformConf
