/// <reference path="ast.ts" />
/// <reference path="visit.ts" />

interface Type {
  tag: TypeTag,
  stage: number,
}

enum TypeTag {
  Int,
}

// These should probably be interned.
function mktype(tag: TypeTag, stage: number = 0): Type {
  return {
    tag: tag,
    stage: stage,
  };
}

function _repeat(s: string, n: number): string {
  let o = "";
  for (let i = 0; i < n; ++i) {
    o += s;
  }
  return o;
}

function pretty_type(t: Type): string {
  let s = TypeTag[t.tag];
  if (t.stage > 0) {
    s = _repeat("<", t.stage) + s + _repeat(">", t.stage);
  } else if (t.stage < 0) {
    s = _repeat("[", -t.stage) + s + _repeat("]", -t.stage);
  }
  return s;
}

interface TypeEnv {
  [key: string]: Type;
}

// Adjust the stage of every type in an environment.
function stage_env(e: TypeEnv, amount: number = 1): TypeEnv {
  let e2 : TypeEnv = {};
  for (let key in e) {
    let t : Type = e[key];
    e2[key] = mktype(t.tag, t.stage + amount);
  }
  return e2;
}


// Type rules.

let Typecheck : ASTVisit<[TypeEnv, number], [Type, TypeEnv]> = {
  visit_literal(tree: LiteralNode, [env, level]: [TypeEnv, number]): [Type, TypeEnv] {
    return [mktype(TypeTag.Int), env];
  },

  visit_seq(tree: SeqNode, [env, level]: [TypeEnv, number]): [Type, TypeEnv] {
    let [t, e] = check(tree.lhs, env, level);
    return check(tree.rhs, e, level);
  },

  visit_let(tree: LetNode, [env, level]: [TypeEnv, number]): [Type, TypeEnv] {
    let [t, e] = check(tree.expr, env, level);
    // Like the interpreter, we abuse prototypes to create an overlay
    // environment.
    let e2 = <TypeEnv> Object.create(e);
    e2[tree.ident] = t;
    return [t, e2];
  },

  visit_lookup(tree: LookupNode, [env, level]: [TypeEnv, number]): [Type, TypeEnv] {
    let t = env[tree.ident];
    if (t === undefined) {
      throw "type error: undefined variable " + tree.ident;
    }
    return [t, env];
  },

  visit_binary(tree: BinaryNode, [env, level]: [TypeEnv, number]): [Type, TypeEnv] {
    let [t1, e1] = check(tree.lhs, env, level);
    let [t2, e2] = check(tree.rhs, e1, level);
    if (t1.stage == 0 && t2.stage == 0) {
      if (t1.tag == TypeTag.Int && t2.tag == TypeTag.Int) {
        return [mktype(TypeTag.Int), env];
      } else {
        throw "type error: binary operation on non-numbers";
      }
    } else {
      throw "type error: binary operation on wrong stage";
    }
  },

  visit_quote(tree: QuoteNode, [env, level]: [TypeEnv, number]): [Type, TypeEnv] {
    // Move the current context "up" before checking inside the quote.
    let inner_env = stage_env(env, -1);
    let [t, e] = check(tree.expr, inner_env, level + 1);

    // And move the result type back "down".
    return [mktype(t.tag, t.stage + 1), env];
  },

  visit_escape(tree: EscapeNode, [env, level]: [TypeEnv, number]): [Type, TypeEnv] {
    // Escaping beyond the top level is not allowed.
    if (level == 0) {
      throw "type error: top-level escape";
    }

    // Move the context "down", in the opposite direction of quotation.
    let inner_env = stage_env(env, 1);
    let [t, e] = check(tree.expr, inner_env, level - 1);

    // Ensure that the result of the escape's expression is code, so it can be
    // spliced.
    if (t.stage < 1) {
      throw "type error: escape produced non-code value";
    }

    // Since it is safe to do so, move the resulting type back "up" one stage.
    return [mktype(t.tag, t.stage - 1), env];
  },

  visit_run(tree: RunNode, [env, level]: [TypeEnv, number]): [Type, TypeEnv] {
    let [t, e] = check(tree.expr, env, level);
    if (t.stage > 0) {
      return [mktype(t.tag, t.stage - 1), e];
    } else {
      throw "type error: running a non-code type";
    }
  },
}

function check(tree: SyntaxNode, env: TypeEnv, level: number): [Type, TypeEnv] {
  return ast_visit(Typecheck, tree, [env, level]);
}

function typecheck(tree: SyntaxNode): Type {
  let [t, e] = check(tree, {}, 0);
  return t;
}
