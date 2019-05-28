# Tests

```bash
# Run all tests & create coverage report
>> npm run test
# Run a single test (adjust file in package.json)
>> npm run test-single
```

The test use mocha + chai. Instead of using mocha with ts-node, the project is first built and tests are executed with the transpiled javascript. This has two reasons: 1) Its a pain to have the typings (espcially custom types) set up as in the original project, 2) The module-alias is not working with ts-node which would result in having to go back to relative imports only.