import * as llvm_be from './llvm';
import * as llvm from '../../node_modules/llvmc/src/wrapped';
import { ASTVisit, ast_visit, compose_visit } from '../visit';
import * as ast from '../ast';

//////////////////////////////////////////
// useful openGL bindings
//////////////////////////////////////////

/**
 * Methods for getting various openGL types
 */
function glchar(): llvm.Type   {return llvm.IntType.int8();}
function glstring(): llvm.Type {return llvm.PointerType.create(glchar(), 0);}
function glint(): llvm.Type    {return llvm.IntType.int32();}
function gluint(): llvm.Type   {return llvm.IntType.int32();}
function glsizei(): llvm.Type  {return llvm.IntType.int32();}
function glenum(): llvm.Type   {return llvm.IntType.int32();}

/*
 * GLuint glCreateShader(GLenum shaderType)
 */
function glCreateShader(emitter: llvm_be.LLVMEmitter, shader_type: llvm.Value): llvm.Value {
  let func: llvm.Function = emitter.mod.getFunction("glCreateShader");
  if (func.ref.isNull()) {
    let ret_type: llvm.Type = gluint();
    let arg_types: llvm.Type[] = [glenum()];
    let func_type: llvm.FunctionType = llvm.FunctionType.create(ret_type, arg_types);
    func = emitter.mod.addFunction("glCreateShader", func_type);
  }
  return emitter.builder.buildCall(func, [shader_type], "");
}

/*
 * void glShaderSource(GLuint shader, GLsizei count, const GLchar **string, const GLint *length)
 */
function glShaderSource(emitter: llvm_be.LLVMEmitter, shader: llvm.Value, count: llvm.Value, sources: llvm.Value, lengths: llvm.Value): llvm.Value {
  let func: llvm.Function = emitter.mod.getFunction("glShaderSource");
  if (func.ref.isNull()) {
    let ret_type: llvm.Type = llvm.VoidType.create();
    let arg_types: llvm.Type[] = [gluint(), glsizei(), llvm.PointerType.create(glstring(), 0), llvm.PointerType.create(glint(), 0)];
    let func_type: llvm.FunctionType = llvm.FunctionType.create(ret_type, arg_types);
    func = emitter.mod.addFunction("glShaderSource", func_type);
  } 
  return emitter.builder.buildCall(func, [shader, count, sources, lengths], "");
}

/*
 * void glCompileShader(  GLuint shader)
 */
function glCompileShader(emitter: llvm_be.LLVMEmitter, shader_type: llvm.Value): llvm.Value {
  let func: llvm.Function = emitter.mod.getFunction("glCompileShader");
  if (func.ref.isNull()) {
    let ret_type: llvm.Type = llvm.VoidType.create();
    let arg_types: llvm.Type[] = [gluint()];
    let func_type: llvm.FunctionType = llvm.FunctionType.create(ret_type, arg_types);
    func = emitter.mod.addFunction("glCompileShader", func_type);
  }
  return emitter.builder.buildCall(func, [shader_type], "");
}

function glGetShaderParameter(emitter: llvm_be.LLVMEmitter): llvm.Value {
  throw "not implemented yet";
}

function glGetShaderInfoLog(emitter: llvm_be.LLVMEmitter): llvm.Value {
  throw "not implemented yet";
}

/*
 * GLuint glCreateProgram(void)
 */
function glCreateProgram(emitter: llvm_be.LLVMEmitter): llvm.Value {
  let func: llvm.Function = emitter.mod.getFunction("glCreateProgram");
  if (func.ref.isNull()) {
    let ret_type: llvm.Type = gluint();
    let arg_types: llvm.Type[] = [];
    let func_type: llvm.FunctionType = llvm.FunctionType.create(ret_type, arg_types);
    func = emitter.mod.addFunction("glCreateProgram", func_type);
  }
  return emitter.builder.buildCall(func, [], "");
}

/*
 * void glAttachShader(GLuint program, GLuint shader)
 */
function glAttachShader(emitter: llvm_be.LLVMEmitter, program: llvm.Value, shader: llvm.Value): llvm.Value {
  let func: llvm.Function = emitter.mod.getFunction("glAttachShader");
  if (func.ref.isNull()) {
    let ret_type: llvm.Type = llvm.VoidType.create();
    let arg_types: llvm.Type[] = [gluint(), gluint()];
    let func_type: llvm.FunctionType = llvm.FunctionType.create(ret_type, arg_types);
    func = emitter.mod.addFunction("glAttachShader", func_type);
  }
  return emitter.builder.buildCall(func, [program, shader], "");
}

/*
 * void glLinkProgram(GLuint program)
 */
function glLinkProgram(emitter: llvm_be.LLVMEmitter, program: llvm.Value): llvm.Value {
  let func: llvm.Function = emitter.mod.getFunction("glLinkProgram");
  if (func.ref.isNull()) {
    let ret_type: llvm.Type = llvm.VoidType.create();
    let arg_types: llvm.Type[] = [gluint()];
    let func_type: llvm.FunctionType = llvm.FunctionType.create(ret_type, arg_types);
    func = emitter.mod.addFunction("glLinkProgram", func_type);
  }
  return emitter.builder.buildCall(func, [program], "");
}

function glGetProgramParameter(emitter: llvm_be.LLVMEmitter): llvm.Value {
  throw "not implemented yet";
}

/*
 * void glGetProgramInfoLog(  GLuint program, GLsizei maxLength, GLsizei *length, GLchar *infoLog)
 */
function glGetProgramInfoLog(emitter: llvm_be.LLVMEmitter, program: llvm.Value, max_length: llvm.Value, length: llvm.Value, info_log: llvm.Value): llvm.Value {
  let func: llvm.Function = emitter.mod.getFunction("glGetProgramInfoLog");
  if (func.ref.isNull()) {
    let ret_type: llvm.Type = llvm.VoidType.create();
    let arg_types: llvm.Type[] = [gluint(), glsizei(), llvm.PointerType.create(glsizei(),0), glstring()];
    let func_type: llvm.FunctionType = llvm.FunctionType.create(ret_type, arg_types);
    func = emitter.mod.addFunction("glGetProgramInfoLog", func_type);
  }
  return emitter.builder.buildCall(func, [program, max_length, length, info_log], "");
}
//////////////////////////////////////////

/*
 * Call printf
 */
function printf(emitter: llvm_be.LLVMEmitter, str: llvm.Value, args: llvm.Value[]): llvm.Value {
  let func: llvm.Function = emitter.mod.getFunction("printf");
  if (func.ref.isNull()) {
    let ret_type: llvm.Type = llvm.IntType.int32();
    let arg_types: llvm.Type[] = [llvm.PointerType.create(llvm.IntType.int8(), 0)];
    let func_type: llvm.FunctionType = llvm.FunctionType.create(ret_type, arg_types, true);
    func = emitter.mod.addFunction("printf", func_type);
  }
  let _args: llvm.Value[] = [];
  _args.push(str, ...args);
  return emitter.builder.buildCall(func, _args, "");
}

function compile_glsl(emitter: llvm_be.LLVMEmitter, shader_type: number, source: string) {
  let shader: llvm.Value = glCreateShader(emitter, llvm.ConstInt.create(shader_type, glenum()));

  //glShaderSource(emitter, shader, llvm.ConstInt.create(1, glsizei()), sources, lengths);
  throw "not implemented yet";
}

// Extend the JavaScript compiler with some WebGL specifics.
let compile_rules: ASTVisit<llvm_be.LLVMEmitter, llvm.Value> =
  compose_visit(llvm_be.compile_rules, {
    // Compile calls to our intrinsics for binding shaders.
    visit_call(tree: ast.CallNode, emitter: llvm_be.LLVMEmitter): llvm.Value {
      throw "not implemented yet"
    },

    visit_binary(tree: ast.BinaryNode, emitter: llvm_be.LLVMEmitter): llvm.Value {
      throw "not implemented yet"
    },
  });





