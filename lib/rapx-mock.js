var time = require('./time.js');
var stream = process.stdout;
var _ = fis.util;
var path = require('path');
var fs = require('fs');
var transformConf = require('./transformConf.js')
var preRapxConfig = transformConf()

// 参考https://github.com/fex-team/fis3-deploy-local-deliver/blob/master/index.js#L46
function deliverToLocal(content) {
    var output = fis.project.getTempPath()
    var release = '/www/plugin/compiler.require.php'
      if (_.exists(output) && !_.isDir(output)) {
        fis.log.error('unable to deliver file[ compiler.require.php ] to dir[' + output + ']: invalid output dir.');
      }
      var target;
      target = _(output, release);
      console.log('target', target)
      _.write(target, content);
}

// 参考 https://github.com/fex-team/fis3-deploy-http-push/blob/master/index.js#L9
function uploadToRemote(receiver, to, content, callback) {
  var data = {}
  callback = callback || function() {}

  data['to'] = to + '/baiduplugins/compiler.require.php'
  var subpath = 'compiler.require.php'
  _.upload( // http://fis.baidu.com/fis3/api/util.js.html#line1200
      //url, request options, post data, file
      receiver, null, data, content, subpath,
      function(err, res) {
        var json = null;
        res = res && res.trim();
        try {
          json = res ? JSON.parse(res) : null;
        } catch (e) {}

        if (!err && json && json.errno) {
          callback(json);
        } else if (err || !json && res != '0') {
          callback('upload file [' + subpath + '] to [' + to + '] by receiver [' + receiver + '] error [' + (err || res) + ']');
        } else {
          callback();
        }
      }
  );
}

function getRemoteReciver(currentMedia) {
    var matches = fis.config.media(currentMedia).getMatches()
    var res = {receiver: '', to: ''}

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

function upload(options) {
    var currentMedia = fis.project.currentMedia()
    var content = fs.readFileSync( path.resolve(__dirname, '../vendor/compiler.require.php') ).toString()
    if(currentMedia === 'prod' || (currentMedia === 'dev' && !options.root)) {
        // do nothing
        stream.write('\n [RAPX-Mock]'.green + ' currentMedia: '+currentMedia+', no plugin uploaded. \n');
    } else if(currentMedia === 'dev' && options.root) {
        deliverToLocal(content)
    } else {
        var remote = getRemoteReciver(currentMedia)
        uploadToRemote(remote.receiver, remote.to, content)
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

        var content = file.getContent();
        if(~content.indexOf(rapxConfig.mockRule[file.subpath])) { // 已经设置了mockRule 并没有新的mockRule 则退出
          if(preRapxConfig.mockRule[file.subpath] === rapxConfig.mockRule[file.subpath]) {
            stream.write('\n [RAPX-Mock]'.green + ' already setted mockRule: ' + file.subpath + '\n')
            return
          } else {
            content.replace(preRapxConfig.mockRule[file.subpath], '')
            preRapxConfig.mockRule[file.subpath] = rapxConfig.mockRule[file.subpath]
            stream.write('\n [RAPX-Mock]'.green + ' detected rapx-mock.conf changed, YOU NEED release once again. \n')
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
    })

  try {
    next(null, {
        options: options
    })
    // release
    // fis.release(options);
    upload(options)
  } catch (e) {
    fis.emit('release:error', e);
    process.stdout.write('\n [ERROR] ' + (e.message || e) + '\n');
    fis.log.debug(e.stack);
    process.exit(1);
    next(e);
  }
}

module.exports = mock
