var fs = require('fs')
var URL = require('url')
var _ = fis.util
var operators = ['mock', 'replace', 'defaultMode', 'vue', 'axios', 'vueResource', 'pluginPath']

var config = {
    fileExt: ['.tpl'],
    mockRule:{},
    replaceReg: /(\{%\s*block\s*name\=[\"|\']top-head-extend[\"|\']%\})((?:(?!\{%\/\s*block).|\n)*)(\{%\/\s*block\s*%\})/g,
    defaultMode: 1,
    pluginPath: '',
    vuePath: '',
    vueResourcePath: '',
    axiosPath: ''
}

function wrapVueAndAxios() {
    if(config.vuePath && config.vueResourcePath || config.axiosPath) {

        var rulesKeys = Object.keys(config.mockRule) 
        var strRegex = "((https|http)://)"
                    + "(([0-9]{1,3}\.){3}[0-9]{1,3}" // IP形式的URL- 199.194.52.184 
                    + "|" // 允许IP和DOMAIN（域名）
                    + "([0-9a-z_!~*'()-]+\.)*" // 域名- www. 
                    + "([0-9a-z][0-9a-z-]{0,61})?[0-9a-z]\." // 二级域名 
                    + "[a-z]{2,6})" // first level domain- .com or .museum 
                    + "(:[0-9]{1,4})?" // 端口- :80 
                    + "(/)" // a slash isn't required if there is no file name 
                    + "([a-zA-Z0-9\&%_\./-~-=\:]*)"; 
        for(var i = 0, len = rulesKeys.length; i < len; i++) {
            var res = config.mockRule[rulesKeys[i]].match(new RegExp(strRegex, 'g'))
            if(res && res.length !== 0) {
                var urlObj = URL.parse(res[0], true)
                urlObj.search = undefined;
                if(!urlObj.query.vue && !urlObj.query.vueResource) {
                    urlObj.query.vue = config.vuePath
                    urlObj.query.vueResource = config.vueResourcePath
                } 
                if(!urlObj.query.axios) {
                    urlObj.query.axios = config.axiosPath
                }
                config.mockRule[rulesKeys[i]] = config.mockRule[rulesKeys[i]].replace(res[0], decodeURIComponent(URL.format(urlObj)) )
            }
        }
     } 
}

function transformConf () {
    var conf = fs.existsSync('rapx-mock.conf') ? fs.readFileSync('rapx-mock.conf').toString() : ''
    var lines = conf.split('\n')
    for(var i = 0, len = lines.length; i < len; i++) {
        var quoteIndex = _.trim(lines[i]).indexOf('#')
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
                case 'vue': 
                    config.vuePath = rules[1];
                    break;
                case 'pluginPath': 
                    config.pluginPath = rules[1];
                    break;
                case 'vueResource': 
                    config.vueResourcePath = rules[1];
                    break;
                case 'axios': 
                    config.axiosPath = rules[1];
                    break;
                case 'insertFileExt': 
                    config.fileExt = rules.slice(1);
                    break;
            }
        }
    }
    wrapVueAndAxios()
    return config
}

module.exports = transformConf
