const { spawnSync } = require('node:child_process');

const testDatabaseUrl = process.env.TEST_DATABASE_URL;
if (!testDatabaseUrl || !/asanop[_-]test/i.test(testDatabaseUrl)) {
  console.error(
    'Refusing to run e2e tests. Set TEST_DATABASE_URL to a dedicated PostgreSQL database containing "asanop_test" in its name.',
  );
  process.exit(1);
}

const jestBin = require.resolve('jest/bin/jest');
const result = spawnSync(process.execPath, [jestBin, '--config', './test/jest-e2e.json', '--runInBand'], {
  cwd: __dirname + '/..',
  env: {
    ...process.env,
    NODE_ENV: 'test',
    DATABASE_URL: testDatabaseUrl,
  },
  stdio: 'inherit',
});

process.exit(result.status ?? 1);
