# redstd [![License][LicenseIMGURL]][LicenseURL] [![NPM version][NPMIMGURL]][NPMURL] [![Build Status][BuildStatusIMGURL]][BuildStatusURL] [![Coverage Status][CoverageIMGURL]][CoverageURL]

[NPMURL]: https://npmjs.org/package/redstd "npm"
[NPMIMGURL]: https://img.shields.io/npm/v/redstd.svg?style=flat
[BuildStatusURL]: https://github.com/coderaiser/redstd/actions?query=workflow%3A%22Node+CI%22 "Build Status"
[BuildStatusIMGURL]: https://github.com/coderaiser/redstd/workflows/Node%20CI/badge.svg
[LicenseURL]: https://tldrlegal.com/license/mit-license "MIT License"
[LicenseIMGURL]: https://img.shields.io/badge/license-MIT-317BF9.svg?style=flat
[CoverageURL]: https://coveralls.io/github/coderaiser/redstd?branch=master
[CoverageIMGURL]: https://coveralls.io/repos/coderaiser/redstd/badge.svg?branch=master&service=github

Read `stdin` to have ability to use pipes like: `cat README.md | less` or

```sh
cat README.md | node -e "const {readStdin} = await import('redstd'); console.log(await readStdin())"
```

When you pass nothing to stdin - everything just works, so you can read from stdout or from file

## Install

```
npm i redstd
```

# Usage

```js
import {readFile} from 'node:fs/promises';
import {readStdin} from 'redstd';

const input = await readStdin();

if (!input) {
    console.log(await readFile('./README.md'));
    process.exit();
}

console.log(input);
```

## License

MIT
