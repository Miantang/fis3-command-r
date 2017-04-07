var time = require('./time.js');
var stream = process.stdout;
var _ = fis.util;
var path = require('path');
var fs = require('fs');
var transformConf = require('./transformConf.js')
var preRapxConfig = transformConf()

// 参考https://github.com/fex-team/fis3-deploy-local-deliver/blob/master/index.js#L46
function deliverToLocal(content, release) {
    var output = fis.project.getTempPath()
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
    if(currentMedia === 'dev') {
        deliverToLocal(content, release)
    } else {
        uploadToRemote(content, release, fileSubpath, remote.receiver, remote.to)
    }
}

function getPluginRemoteReciver(currentMedia) {
    var res = {receiver: '', to: ''}
    if(currentMedia === 'dev') return res

    var matches = fis.config.media(currentMedia).getMatches()

    for(var len = matches.length, i = len - 1; i >= 0; i--) {
        if(~matches[i].pattern.indexOf('plugin')) {
            res.receiver = matches[i].properties.deploy.receiver
            res.to = matches[i].properties.deploy.to
            break;
        } else {
            continue;
        }
    }

    return res
}

function uploadPluginFile(options) {
    var type = options.resetPlugin ? 'old' : 'new'
    var currentMedia = fis.project.currentMedia()
    if(currentMedia === 'prod' || (currentMedia === 'dev' && !options.root)) {
        // do nothing
        stream.write('\n [RAPX-Mock]'.green + ' currentMedia: '+currentMedia+', no plugin uploaded. \n');
    } else {
        var releasePrefix = '/baiduplugins/';
        var pluginDir = path.resolve(__dirname, '../vendor/' + type)
        var remoteTarget = getPluginRemoteReciver(currentMedia)
        fs.readdirSync(pluginDir).forEach(function (item) {
            if(currentMedia === 'dev') {
                releasePrefix = '/www/plugin/'
            }
            var content = fs.readFileSync( path.resolve(pluginDir, item) ).toString()
            releaseTo(content, releasePrefix + item, item,  remoteTarget)
        })
    }
}

function mockToFile(file) {
    if (file.isPartial || file.ext !== '.tpl')return;
    if (file.isText() || typeof(file.getContent()) === 'string' && file.ext === '.tpl') {
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
        stream.write('\n [RAPX-Mock]'.green + ' add rule to ' + file.subpath + '\n');

        if (result !== content) {
            fis.log.debug('Replace from %s in file [%s]', rapxConfig.replaceReg, file);
            file.setContent(result);
        }
        if(needRelease) {
            releaseTo(result, file.release, file.subpath, {receiver: file.deploy.receiver, to: file.deploy.to})
        }
    }
}

function mock(options, next) {
    fis.on('deploy:start', function(groups) {
      groups.forEach(function(group) {
        var all = group.total
        if(!all.length) { return }
          all.forEach(function(file) {
            mockToFile(file)
          })
      })
      preRapxConfig = _.defaultsDeep({}, transformConf())
    })

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
