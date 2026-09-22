const path = require('node:path');
const ts = require('typescript');
const root = path.resolve(__dirname, '../../..');
const configFile = ts.readConfigFile(path.join(root, 'tsconfig.json'), ts.sys.readFile);
const config = ts.parseJsonConfigFileContent(
  {
    ...configFile.config,
    include: [
      '@types/**/*.d.ts',
      'global.d.ts',
      path.relative(root, path.resolve(__dirname, '..')).replaceAll('\\', '/') + '/**/*.ts',
    ],
    compilerOptions: { ...configFile.config.compilerOptions, noEmit: true, skipLibCheck: true },
  },
  ts.sys,
  root,
);
const program = ts.createProgram(config.fileNames, config.options);
const errors = ts.getPreEmitDiagnostics(program);
if (errors.length) {
  console.error(
    ts.formatDiagnosticsWithColorAndContext(errors, {
      getCanonicalFileName: name => name,
      getCurrentDirectory: () => root,
      getNewLine: () => '\n',
    }),
  );
  process.exitCode = 1;
} else console.log('Death-adaptation TypeScript check passed.');
