var path = require('path');
var fs = require('fs');
var stream = process.stdout;
var _ = fis.util;
var time = require('./lib/time.js');
// fis.log.level = fis.log.L_DEBUG
var rapxMock = require('./lib/rapx-mock.js');
var delMockCache = require('./lib/del-mock-cache.js');

exports.name = 'r [media name]';
exports.desc = 'build and deploy your rapx-mock project';
exports.options = {
  '-h, --help': 'print this help message',
  '-m, --mock': '使用rapx的mock功能，并替换相关smarty plugin',
  '--reset': '重置目标环境的相关smarty plugin(需要搭配-m一起使用)',
  '--init': '初始化一个rapx-mock.conf'
};

exports.run = function(argv, cli, env) {
  // 显示帮助信息
  if (argv.h || argv.help) {
    return cli.help(exports.name, exports.options);
  }

  validate(argv);

  // normalize options
  var options = {
    dest: argv.dest || argv.d,
    root: !!(argv.r || argv.root),
    watch: !!(argv.watch || argv.w),
    live: !!(argv.live || argv.L),
    clean: !!(argv.clean || argv.c),
    unique: !!(argv.unique || argv.u),
    useLint: !!(argv.lint || argv.l),
    useMock: !!(argv.mock || argv.m),
    initConf: !!argv.init,
    resetPlugin: !!argv.reset,
    verbose: !!argv.verbose
  };

  if(options.initConf) {
    var confContent = fs.readFileSync( path.resolve(__dirname, './vendor/rapx-mock.conf') ).toString()
     _.write(_(fis.project.getProjectPath(), '/rapx-mock.conf'), confContent);
     stream.write('\n [RAPX-Mock]'.green + ' init file rapx-mock.conf. \n');
     return;
  }

  var app = require('./lib/chains.js')();

  if(argv._[1]) {
    fis.project.currentMedia(argv._[1]);
  }

  if(options.useMock) {
      if(!_.exists(_(fis.project.getProjectPath(), '/rapx-mock.conf')) ) {
          stream.write('\n [RAPX-Mock]'.green + ' not existed rapx-mock.conf! Please run fis3 r --init. \n')
          return
      }
    app.use(rapxMock);
  } else {
    if(!_.exists(_(fis.project.getProjectPath(), '/rapx-mock.conf')) ) {
        stream.write('\n [RAPX-Mock]'.green + ' not existed rapx-mock.conf! Please run fis3 r --init. \n')
    }
    app.use(delMockCache)
  }

  app.run(options);

  // run it.
  var newArgv = _.assign({}, argv)
  newArgv._[0] = 'release'
  delete newArgv.m
  delete newArgv.mock
  delete newArgv.init
  delete newArgv.reset

  fis.cli.run(newArgv, env)

};

function validate(argv) {
  if (argv._.length > 2) {
    fis.log.error('Unregconized `%s`, please run `%s release --help`', argv._.slice(2).join(' '), fis.cli.name);
  }

  var allowed = ['_', 'dest', 'd', 'lint', 'l', 'watch', 'w', 'live', 'L', 'clean', 'c',
                    'unique', 'u', 'verbose', 'color', 'root', 'r', 'f', 'file', 'child-flag',
                    'm', 'mock', 'init', 'reset'];

  Object.keys(argv).forEach(function(k) {
    if (!~allowed.indexOf(k)) {
      fis.log.error('The option `%s` is unregconized, please run `%s release --help`', k, fis.cli.name);
    }
  });
}
