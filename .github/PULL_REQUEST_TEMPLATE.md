## What this changes

<!-- One or two sentences. What is different after this pull request? -->

## Why

<!-- The problem this solves. Link the issue if there is one. -->

## How it was verified

<!-- Be specific. "Tests pass" is not evidence; "bun run test:run -> 41/41, and
     I drove the real app and saw X" is. -->

- [ ] `bun run test:run` passes
- [ ] `bun run build` succeeds
- [ ] The change was exercised in the real app, not only in a test
- [ ] No credentials, tokens or private data are in the diff
- [ ] The secret sweep is clean: `gitleaks git --redact=0 --report-path /tmp/leaks.json .` exits `0`
- [ ] Documentation updated if the behaviour or the structure changed
