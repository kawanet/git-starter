# git-starter

Initialize a project with a starter skeleton on a git repository.

## Installation

```sh
    npm install -g git-starter
```

## Usage

```sh
    # start with starter.json bundled with git-starter
    git-starter node-cli-starter my-module

    # start with starter skeleton on remote git repository
    git-starter git://github.com/kawanet/node-cli-starter.git my-module

    # start with starter skeleton in local git repository
    git-starter file:///path/to/some-starter/.git my-module

    # start with starter.json specified
    git-starter ./path/to/starter.json my-module

    # then
    cd my-module
    git init
    git add .
    git commit -m 'first commit'
```

## Bundled Starters

- [node-cli-starter](https://github.com/kawanet/node-cli-starter)
- [nginx-static-starter](https://github.com/kawanet/nginx-static-starter)

## Example: starter.json

```json
{
    "name": "node-cli-starter",
    "description": "Node.js CLI Module Starter",
    "repository": "git://github.com/kawanet/node-cli-starter.git",
    "author": "@kawanet",
    "starter.version": "1.0",
    "starter.parameters": {
        "name": "package name: ex. 'node-my-module'",
        "description": "module description",
        "repository": "git repository URL",
        "author": "module author: ex. '@twitter'",
        "module": "class name: ex. 'MyModule'",
        "method": "first method name: ex. 'load'"
    },
    "starter.skip": [
        "*.jpg", "*.png", "*.gif"
    ]
}
```

- `name` `description` `repository` `author` : default values for parameters
- `starter.version` : version number for starter.json format (1.0)
- `starter.parameters` : list of parameters and descriptions
- `starter.skip` : filename which will be ignored by git-starter

## Author

@kawanet

## Licence

Copyright 2013 @kawanet

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
