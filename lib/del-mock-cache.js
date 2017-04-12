var time = require('./time.js');
var stream = process.stdout;
var _ = fis.util;
var path = require('path');
var fs = require('fs');
var transformConf = require('./transformConf.js')

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

function deleteMockCache(file) {
    if (file.isPartial || file.ext !== '.tpl')return;
    if (file.isText() || typeof(file.getContent()) === 'string' && file.ext === '.tpl') {
        var rapxConfig = transformConf()
        if(!rapxConfig.mockRule.hasOwnProperty(file.subpath)) return // 未设置 完全匹配的路径 的mockRule 则退出

        var content = file.getContent();
        if(~content.indexOf(rapxConfig.mockRule[file.subpath])) {
            content = content.replace(rapxConfig.mockRule[file.subpath], '')
            stream.write('\n [RAPX-Mock]'.green + ' detected rapx mock cache, delete and release ' + file.subpath + ' again.\n')
            file.setContent(content)

            var remote = {receiver:'', to: ''}
            if(file.deploy) {
                remote = {receiver: file.deploy.receiver, to: file.deploy.to}
            }
            releaseTo(content, file.release, file.subpath, remote)
        }
    }
}

function delMock(options, next) {
    fis.on('deploy:start', function(groups) {
      groups.forEach(function(group) {
        var all = group.total
        if(!all.length) { return }
          all.forEach(function(file) {
            deleteMockCache(file)
          })
      })
    })
}

module.exports = delMock
