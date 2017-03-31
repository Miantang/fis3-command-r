var _ = fis.util;
var time = require('./lib/time.js');
// fis.log.level = fis.log.L_DEBUG
var rapxMock = require('./lib/rapx-mock.js');

exports.name = 'r [media name]';
exports.desc = 'build and deploy your project';
exports.options = {
  '-h, --help': 'print this help message',
  '-d, --dest <path>': 'release output destination',
  '-l, --lint': 'with lint',
  '-w, --watch': 'monitor the changes of project',
  '-L, --live': 'automatically reload your browser',
  '-c, --clean': 'clean compile cache',
  '-u, --unique': 'use unique compile caching',
  '-r, --root <path>': 'specify project root',
  '-f, --file <filename>': 'specify the file path of `fis-conf.js`',
  '-m, --mock': 'use rapx mock insertion',
  '--no-color': 'disable colored output',
  '--verbose': 'enable verbose mode'
};

exports.run = function(argv, cli, env) {
  // 显示帮助信息
  if (argv.h || argv.help) {
    return cli.help(exports.name, exports.options);
  }

  validate(argv);

  // normalize options
  var options = {
    dest: argv.dest || argv.d || 'preview',
    root: !!(argv.r || argv.root),
    watch: !!(argv.watch || argv.w),
    live: !!(argv.live || argv.L),
    clean: !!(argv.clean || argv.c),
    unique: !!(argv.unique || argv.u),
    useLint: !!(argv.lint || argv.l),
    useMock: !!(argv.mock || argv.m),
    verbose: !!argv.verbose
  };

  var app = require('./lib/chains.js')();

  if(options.useMock) {
    app.use(rapxMock);
  }

  // run it.
  var newArgv = _.assign({}, argv)
  newArgv._[0] = 'release'
  delete newArgv.m
  delete newArgv.mock
  fis.cli.run(newArgv, env)
  app.run(options);
};

function validate(argv) {
  if (argv._.length > 2) {
    fis.log.error('Unregconized `%s`, please run `%s release --help`', argv._.slice(2).join(' '), fis.cli.name);
  }

  var allowed = ['_', 'dest', 'd', 'lint', 'l', 'watch', 'w', 'live', 'L', 'clean', 'c', 'unique', 'u', 'verbose', 'color', 'root', 'r', 'f', 'file', 'child-flag', 'm', 'mock'];

  Object.keys(argv).forEach(function(k) {
    if (!~allowed.indexOf(k)) {
      fis.log.error('The option `%s` is unregconized, please run `%s release --help`', k, fis.cli.name);
    }
  });
}
