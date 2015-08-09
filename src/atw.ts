/// <reference path="../typings/node/node.d.ts" />
/// <reference path="interp.ts" />

let fs = require('fs');
let parser = require('./parser.js');

function parse(filename: string, f: (tree: SyntaxNode) => void) {
  fs.readFile(filename, function (err, data) {
    if (err) {
      console.log(err);
      process.exit(1);
    }
    let s = data.toString();

    let tree;
    try {
      tree = parser.parse(s);
    } catch (e) {
      if (e instanceof parser.SyntaxError) {
        console.log('parse error at '
                    + filename + ':' + e.line + ',' + e.column
                    + ': ' + e.message);
        process.exit(1);
      } else {
        throw e;
      }
    }

    f(tree);
  });
}

function main() {
  let fn = process.argv[2];
  if (!fn) {
    console.log("no input provided");
    process.exit(1);
  }

  parse(fn, function (tree) {
    console.log(tree);
    console.log(interpret(tree));
  });
}

main();