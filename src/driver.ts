import { SyntaxNode } from './ast';
import { TypeMap, BUILTIN_TYPES, pretty_type } from './type';
import { BUILTIN_OPERATORS, TypeCheck, gen_check } from './type_check';
import { desugar_cross_stage } from './sugar';
import * as interp from './interp';
import { compose, assign, Gen, scope_eval } from './util';
import { TypeTable, elaborate } from './type_elaborate';
import * as webgl from './backends/webgl';
import * as gl from './backends/gl';
import * as glsl from './backends/glsl';
import * as js from './backends/js';
import { CompilerIR } from './compile/ir';
import { semantically_analyze } from './compile/compile';

// This is a helper library that orchestrates all the parts of the compiler in
// a configurable way. You invoke it by passing continuations through all the
// steps using a configuration object that handles certain events. The steps
// are:
//
// - `frontend`: Parse, typecheck, and desugar. This needs to be done
//   regardless of whether you want to compile or interpret.
// - `interpret`: More or less what it sounds like.
// - `compile`: Compile the checked code to executable code.
// - `execute`: Run the compiled code, hopefully getting the same
//   result as the interpreter would.

export interface Config {
  parser: any,  // The parser object from PEG.js.
  webgl: boolean,

  parsed: (tree: SyntaxNode) => void,
  typed: (type: string) => void,
  error: (err: string) => void,
  log: (...msg: any[]) => void,
}

function _intrinsics(config: Config): TypeMap {
  if (config.webgl) {
    return gl.INTRINSICS;
  } else {
    return BUILTIN_OPERATORS;
  }
}

function _runtime(config: Config): string {
  let runtime = js.RUNTIME + "\n";
  if (config.webgl) {
    runtime += webgl.RUNTIME + "\n";
  }
  return runtime;
}

function _types(config: Config): TypeMap {
  if (config.webgl) {
    return assign({}, BUILTIN_TYPES, gl.GL_TYPES);
  } else {
    return BUILTIN_TYPES;
  }
}

function _check(config: Config): Gen<TypeCheck> {
  let check = gen_check;
  if (config.webgl) {
    check = compose(glsl.type_mixin, check);
  }
  return check;
}

export function frontend(config: Config, source: string,
    filename: string,
    checked: (tree: SyntaxNode, type_table: TypeTable) => void)
{
  // Parse.
  let tree: SyntaxNode;
  try {
    tree = config.parser.parse(source);
  } catch (e) {
    if (e instanceof config.parser.SyntaxError) {
      let loc = e.location.start;
      let err = 'parse error at ';
      if (filename) {
        err += filename + ':';
      }
      err += loc.line + ',' + loc.column + ': ' + e.message;
      config.error(err);
      return;
    } else {
      throw e;
    }
  }
  config.log(tree);

  // Check and elaborate types.
  let elaborated: SyntaxNode;
  let type_table: TypeTable;
  try {
    [elaborated, type_table] =
      elaborate(tree, _intrinsics(config), _types(config),
          _check(config));
    let [type, _] = type_table[elaborated.id];
    config.typed(pretty_type(type));
  } catch (e) {
    config.error(e);
    return;
  }
  config.log('type table', type_table);

  checked(elaborated, type_table);
}

export function compile(config: Config, tree: SyntaxNode,
    type_table: TypeTable, compiled: (code: string) => void)
{
  let ir: CompilerIR;
  ir = semantically_analyze(tree, type_table, _intrinsics(config));

  // Log some intermediates.
  config.log('def/use', ir.defuse);
  config.log('progs', ir.progs);
  config.log('procs', ir.procs);
  config.log('main', ir.main);

  // Compile.
  let jscode: string;
  try {
    if (config.webgl) {
      jscode = webgl.codegen(ir);
    } else {
      jscode = js.codegen(ir);
    }
  } catch (e) {
    if (typeof(e) === "string") {
      config.error(e);
      return;
    } else {
      throw e;
    }
  }

  compiled(jscode);
}

export function interpret(config: Config, tree: SyntaxNode,
    type_table: TypeTable, executed: (result: string) => void)
{
  // Remove cross-stage references.
  let sugarfree = desugar_cross_stage(tree, type_table, _check(config));
  config.log('sugar-free', sugarfree);

  let val = interp.interpret(sugarfree);
  executed(interp.pretty_value(val));
}

// Get the complete, `eval`-able JavaScript program, including the runtime
// code.
export function full_code(config: Config, jscode: string): string {
  return _runtime(config) + jscode;
}

export function execute(config: Config, jscode: string,
    executed: (result: string) => void)
{
  let res = scope_eval(full_code(config, jscode));
  if (config.webgl) {
    throw "error: driver can't execute WebGL programs";
  }

  // Pass a formatted value.
  executed(js.pretty_value(res));
}
