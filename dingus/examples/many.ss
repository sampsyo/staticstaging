# title: lots of objects
# mode: webgl
# ---

var id = mat4.create();

# Load buffers and parameters for the model.
var mesh = bunny;
var position = mesh_positions(mesh);
var normal = mesh_normals(mesh);
var indices = mesh_indices(mesh);
var size = mesh_size(mesh);

def shade(model: Mat4) (
  vertex glsl<
    gl_Position = projection * view * model * vec4(position, 1.0);
    fragment glsl<
      gl_FragColor = vec4(abs(normal), 1.0);
    >
  >
);

render js<
  var i = 100;
  while (i) (
    i = i - 1;

    var model = mat4.create();
    mat4.translate(model, id, vec3(i - 10, 0.0, 0.0));
    shade(model);
    draw_mesh(indices, size);
  )
>