var time = require('./time.js');
var stream = process.stdout;
var _ = fis.util;
var path = require('path');
var fs = require('fs');
var transformConf = require('./transformConf.js')
var preRapxConfig = transformConf()
var optionDest = '' // 如果有-d 参数 赋值为目标路径

// 参考https://github.com/fex-team/fis3-deploy-local-deliver/blob/master/index.js#L46
function deliverToLocal(content, release, targetDest) {
    var output = !!targetDest ? targetDest : fis.project.getTempPath()
    // var release = '/www/plugin/compiler.require.php'
      if (_.exists(output) && !_.isDir(output)) {
        fis.log.error('unable to deliver file[ compiler.require.php ] to dir[' + output + ']: invalid output dir.');
      }
      var target;
      target = _(output, release);
      _.write(target, content);
}

// 参考 https://github.com/fex-team/fis3-deploy-http-push/blob/master/index.js#L9
function uploadToRemote(content, release, fileSubpath, receiver, to, callback) {
  var data = {}
  callback = callback || function() {}

  data['to'] = to + release//'/baiduplugins/compiler.require.php'
  _.upload( // http://fis.baidu.com/fis3/api/util.js.html#line1200
      //url, request options, post data, file
      receiver, null, data, content, fileSubpath,
      function(err, res) {
        var json = null;
        res = res && res.trim();
        try {
          json = res ? JSON.parse(res) : null;
        } catch (e) {}

        if (!err && json && json.errno) {
          callback(json);
        } else if (err || !json && res != '0') {
          callback('upload file [' + fileSubpath + '] to [' + to + '] by receiver [' + receiver + '] error [' + (err || res) + ']');
        } else {
          callback();
        }
      }
  );
}

function releaseTo(content, release, fileSubpath, remote) {
    var currentMedia = fis.project.currentMedia()
    
    if(currentMedia === 'dev' && !optionDest) {
        deliverToLocal(content, release)
    } else if(currentMedia === 'dev' && !!optionDest) {
        var targetDest = _(fis.project.getProjectPath(), optionDest)
        deliverToLocal(content, release, targetDest)
    } else {
        uploadToRemote(content, release, fileSubpath, remote.receiver, remote.to)
    }
}

function getpluginPathReciver(currentMedia) {
    var res = {receiver: '', to: ''}
    if(currentMedia === 'dev') return res
    var matches = fis.config.media(currentMedia).getMatches();
    var len = matches.length;
    for(var i = len - 1; i >= 0; i--) {
        if( matches[i].properties.deploy && matches[i].properties.deploy.receiver) {
            res.receiver = matches[i].properties.deploy.receiver
            break;
        } else {
            continue;
        }
    }
    if(!!preRapxConfig.pluginPath) {
        res.to = preRapxConfig.pluginPath;
        return res;
    }

    for(var i = len - 1; i >= 0; i--) {
        if(~matches[i].pattern.indexOf('plugin') && matches[i].properties.deploy) {
            res.receiver = matches[i].properties.deploy.receiver
            res.to = matches[i].properties.deploy.to
            break;
        } else {
            continue;
        }
    }
    if(!(res.receiver && res.to)) {
        stream.write('\n [RAPX-Mock]'.yellow + ' fis-conf http-push of plugin has no receiver or to. please config deploy info of plugin\n')
    }
    return res
}

function uploadPluginFile(options) {
    var type = options.resetPlugin ? 'old' : 'new'
    var currentMedia = fis.project.currentMedia()
    if(currentMedia === 'prod' || (currentMedia === 'dev' && !options.root && !options.dest)) {
        // do nothing
        stream.write('\n [RAPX-Mock]'.yellow + ' currentMedia: '+currentMedia+', no plugin uploaded. \n');
    } else {
        var releasePrefix = '/baiduplugins/';
        var pluginDir = path.resolve(__dirname, '../vendor/' + type)
        var remoteTarget = getpluginPathReciver(currentMedia)
        fs.readdirSync(pluginDir).forEach(function (item) {
            if(currentMedia === 'dev') {
                releasePrefix = '/www/plugin/'
            }
            var content = fs.readFileSync( path.resolve(pluginDir, item) ).toString()
            releaseTo(content, releasePrefix + item, item,  remoteTarget)
        })
        stream.write('\n [RAPX-Mock]'.green + ' currentMedia: '+currentMedia+', '+type +' plugin uploaded. \n');
    }
}

function mockToFile(file) {
    var acceptableFileExt = !!~preRapxConfig.fileExt.indexOf(file.ext)
    if (file.isPartial || !acceptableFileExt)return;
    if (file.isText() || typeof(file.getContent()) === 'string' && acceptableFileExt) {
        var rapxConfig = transformConf()
        if(!rapxConfig.mockRule.hasOwnProperty(file.subpath)) return // 未设置 完全匹配的路径 的mockRule 则退出
        
        if (_.is(rapxConfig.replaceReg, 'String')) {
            rapxConfig.replaceReg = new RegExp(_.escapeReg(rapxConfig.replaceReg), 'g');
        }

        if (!_.is(rapxConfig.replaceReg, 'RegExp')) {
            fis.log.error('fis3-command-r:replace: replaceReg must a string or RegExp.');
        }
        var needRelease = false
        var content = file.getContent();
        if(~content.indexOf(preRapxConfig.mockRule[file.subpath])) {
          if(preRapxConfig.mockRule[file.subpath] === rapxConfig.mockRule[file.subpath]) {// 已经设置了mockRule 并没有新的mockRule 则退出
            stream.write('\n [RAPX-Mock]'.green + ' already setted mockRule: ' + file.subpath + '\n')
            return
          } else {
            content = content.replace(preRapxConfig.mockRule[file.subpath], '')
            stream.write('\n [RAPX-Mock]'.green + ' detected rapx-mock.conf changed, release ' + file.subpath + ' again.\n')
            needRelease = true
          }
        }
        
        var result = content.replace(rapxConfig.replaceReg, '$1$2'+rapxConfig.mockRule[file.subpath]+'$3');
        if(rapxConfig.replaceReg.exec(content) === null) {
            stream.write('\n [RAPX-Mock]'.green + ' NOT MATCHED rapx-mock.conf[replaceReg], PLEASE CHECK ' + file.subpath + '\n');
            return
        }

        if (result !== content) {
            fis.log.debug('Replace from %s in file [%s]', rapxConfig.replaceReg, file);
            file.setContent(result);
            stream.write('\n [RAPX-Mock]'.green + ' add rule to ' + file.subpath + '\n');
        }
        if(needRelease) {
            var remote = {receiver:'', to: ''}
            if(file.deploy) {
                remote = {receiver: file.deploy.receiver, to: file.deploy.to}
            }
            releaseTo(result, file.release, file.subpath, remote)
        }
    }
}

function mock(options, next) {
    optionDest = options.dest ? options.dest : ''
    if(options.notFekey) {
        fis.on('deploy:start', function(groups) {
            groups.forEach(function(group) {
                var all = group.total
                if(!all.length) { return }
                all.forEach(function(file) {
                    mockToFile(file)
                })
            })
            preRapxConfig = _.defaultsDeep({}, transformConf())
            stream.write('\n [RAPX-Mock]'.yellow + ' [DEBUG] fis.on deploy:start done. \n');
        })
    } else {
        fis.on('release:end', function(ret) {
            Object.keys(ret.src).forEach(function(fileName) {
                mockToFile(ret.src[fileName])
            })
            preRapxConfig = _.defaultsDeep({}, transformConf())
            stream.write('\n [RAPX-Mock]'.yellow + ' [DEBUG] fekey fis.on release:end done. \n');
        })
    }
    

  try {
    next(null, {
        options: options
    })
    uploadPluginFile(options)
  } catch (e) {
    fis.emit('release:error', e);
    process.stdout.write('\n [ERROR] ' + (e.message || e) + '\n');
    fis.log.debug(e.stack);
    process.exit(1);
    next(e);
  }
}

module.exports = mock
