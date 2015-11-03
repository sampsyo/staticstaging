const ATW_EXAMPLES = [
{
name: "basics",
mode: null,
code: `
# There are variables, functions, and
# arithmetic.
var x = 18;
var y = x + 3;
var double = fun n:Int -> n * 2;
double y
`,
},
{
name: "quote and splice",
mode: null,
code: `
# Use <> to defer code, ! to execute it,
# and [] to splice.
var x = <5>;
!< 37 + [x] >
`,
},
{
name: "persist",
mode: null,
code: `
# Cross-stage persistence works either via
# an explicit %[] escape or implicitly using
# variable references.
var x = 2;
var y = !< 37 + %[x] >;  # Explicit.
!< 37 + y >;  # Implicit.
`,
},
{
name: "extern",
mode: null,
code: `
# You can interoperate with JavaScript using
# extern declarations.
extern Math.pow: Int Int -> Int;
Math.pow 7 2;
`,
},
{
name: "basic shader",
mode: "webgl",
code: `
var projection = dingus.projection;
var model = dingus.model;
var view = dingus.view;

# Load buffers and parameters for the model.
var mesh = bunny;
var position = mesh_positions(mesh);
var normal = mesh_normals(mesh);
var indices = mesh_indices(mesh);
var size = mesh_size(mesh);

render r<
  vtx s<
    gl_Position = projection * view * model * vec4(position, 1.0);
    frag s<
      gl_FragColor = vec4(abs(normal), 1.0);
    >
  >;
  draw_mesh(indices, size);
>
`,
},
{
name: "phong lighting shader",
mode: "webgl",
code: `
var projection = dingus.projection;
var model = dingus.model;
var view = dingus.view;

# Load buffers and parameters for the model.
var mesh = teapot;
var position = mesh_positions(mesh);
var normal = mesh_normals(mesh);
var indices = mesh_indices(mesh);
var size = mesh_size(mesh);

var shininess = 0.5;

render r<
  var t = Date.now();
  var lx = Math.sin(t / 200);
  var ly = Math.sin(t / 100);
  var lz = Math.sin(t / 300);
  vtx s<
    var light_position = vec3(lx, ly, lz);

    var view_model = view * model;
    var view_model_position = view_model * vec4(position, 1.0);

    var camera_position = vec3(view_model_position);

    gl_Position = projection * view_model_position;

    # Convert to world space.
    var position_world = vec3(model * vec4(position, 1.0));
    var normal_world = normalize(vec3(model * vec4(position, 0.0)));
    var view_direction = normalize(camera_position - position_world);

    var light_direction = normalize(light_position - position_world);

    var norm_norm = normalize(normal);

    frag s<
      # Phong power.
      var r = -(reflect(light_direction, norm_norm));
      var power = pow(max(0.0, dot(view_direction, r)), shininess);

      gl_FragColor = vec4(power, power, power, 1.0);
    >
  >;
  draw_mesh(indices, size);
>
`,
},
{
name: "two models",
mode: "webgl",
code: `
var projection = dingus.projection;
var model = dingus.model;
var view = dingus.view;

# Bunny model.
var b_position = mesh_positions(bunny);
var b_normal = mesh_normals(bunny);
var b_indices = mesh_indices(bunny);
var b_size = mesh_size(bunny);

# Teapot model.
var t_position = mesh_positions(teapot);
var t_normal = mesh_normals(teapot);
var t_indices = mesh_indices(teapot);
var t_size = mesh_size(teapot);

render r<
  vtx s<
    gl_Position = projection * view * model * vec4(b_position, 1.0);
    frag s<
      gl_FragColor = vec4(abs(b_normal), 1.0);
    >
  >;
  draw_mesh(b_indices, b_size);

  vtx s<
    gl_Position = projection * view * model * vec4(t_position, 1.0);
    frag s<
      gl_FragColor = vec4(abs(t_normal), 1.0);
    >
  >;
  draw_mesh(t_indices, t_size);
>
`,
},
{
name: "(experimental)",
mode: "webgl",
code: `
var projection = dingus.projection;
var model = dingus.model;
var view = dingus.view;

# Bunny model.
var b_position = mesh_positions(bunny);
var b_normal = mesh_normals(bunny);
var b_indices = mesh_indices(bunny);
var b_size = mesh_size(bunny);

# Teapot model.
var t_position = mesh_positions(teapot);
var t_normal = mesh_normals(teapot);
var t_indices = mesh_indices(teapot);
var t_size = mesh_size(teapot);

def simple_shader(pos: (Float3 Array), norm: (Float3 Array)) (
  vtx s<
    gl_Position = projection * view * model * vec4(pos, 1.0);
    frag s<
      gl_FragColor = vec4(abs(norm), 1.0);
    >
  >;
);

render r<
  simple_shader(b_position, b_normal);
  draw_mesh(b_indices, b_size);

  simple_shader(t_position, t_normal);
  draw_mesh(t_indices, t_size);
>
`,
},
];
