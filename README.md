# git-starter - initialize git repository with starter kit

## Installation

```sh
   $ npm install -g git-starter
```

## Usage

```sh
    # init with bundled starter.json
    git-starter node-cli-starter my-module

    # init with starter.json on github repository
    git-starter git://github.com/kawanet/node-cli-starter.git my-module
```

## Example

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
        "method": "first method name: ex. 'load'",
        "short": "short name: ex. 'mymod'"
    },
    "starter.skip": [
        "*.jpg", "*.png", "*.gif"
    ]
}
```

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
