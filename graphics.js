const REZ = 100; 
let H = 150;
let W = 300; 

var last_frac = "mandelbrot"
var shader_iters = 100; 

var sx=sy=2, tx=-0.5, ty=0; 
const SCALE_FACTOR = 0.25; 

function reset(no_main=false) {
  var mandelbrot_pow = document.getElementById("power").value; 
  var frac = document.getElementById("fractal-type").value;
  
  sx=2; sy=2; ty=0; 

  // OG mandelbrot looks a little nicer offset to the side
  if (mandelbrot_pow == 2 && frac == "mandelbrot") {
    tx=-0.5; 
  }
  else if (frac == "lyap") {
    tx=2; ty=2; 
    sx=2; sy=2; 
  }
  else {
    tx=0; 
  }

  if (!no_main){
    main(); 
  }
}

function update_frag_vars() {
  var frac = document.getElementById("fractal-type").value;
  if (frac == "mandelbrot") {
    prog = MANDEL_SHADER; 
  }
  else if (frac == "julia") {
    prog = JULIA_SHADER; 
  } else if (frac == 'newton') {
    prog = NEWTON_SHADER; 
  } else if (frac == 'ship') {
    prog = BURNING_SHIP; 
  } else {
    prog = LYAPUNYAV_SHADER; 
  }

  // Reset coords between fractal types
  var mandelbrot_pow = document.getElementById("power").value; 
  var max_iter = document.getElementById("iterations").value; 

  shader_iters = max_iter; 

  if (frac != last_frac) {
    reset(no_main=true); 
    last_frac = frac;

    if (frac == 'newton' && mandelbrot_pow < 3) {
      // Newton fractals at 2 are super boring
      mandelbrot_pow = 3
      document.getElementById("power").value = 3 
    }

    if (frac == "lyap") {
      document.getElementById("c-real").value = 0.25
    }
  }

  prog = prog.replaceAll('[[POW]]', mandelbrot_pow); 
  prog = prog.replaceAll('[[MAX_ITER]]', max_iter); 

  return prog 
}

function resizeCanvas(){
    const canvas = document.getElementById('glcanvas');
    gl = canvas.getContext('webgl');

    H = window.innerHeight; 
    W = window.innerWidth; 

    let sq = Math.min(H,W)

    gl.canvas.width = sq; 
    gl.canvas.height = sq; 
    gl.canvas.style.width = sq + "px";
    gl.canvas.style.height = sq + "px";

    gl.viewport(0, 0, sq, sq);
}

window.addEventListener('resize', () => main());
document.getElementById('glcanvas').addEventListener('click', (e) => clickCanvas(e, false)); 
document.getElementById('glcanvas').addEventListener('contextmenu', (e) => clickCanvas(e, true)); 

function clickCanvas(e, is_right_click) {
  if (is_right_click) {
    e.preventDefault()
  }

  let rect = e.target.getBoundingClientRect(); 
  let size = rect.width; 

  // Put between 0 and 1 (0,0 is top left)
  let x = e.clientX - rect.left; x /= size; 
  let y = e.clientY - rect.top; y /= size;
  y = 1-y; 

  // Put between -1 and 1
  x = (x-0.5)*2; 
  y = (y-0.5)*2; 

  // Affine transform 
  let translated_x = x*sx + tx; 
  let translated_y = y*sy + ty; 
  tx = translated_x; 
  ty = translated_y; 

  // Left click 
  if (!is_right_click) {
    sx *= 1-SCALE_FACTOR; sy *= 1-SCALE_FACTOR; 
    main(); 
  } 
  // Right click 
  else {
    sx *= 1 + SCALE_FACTOR; sy *= 1 + SCALE_FACTOR; 
    main(); 
  }
}

function buildShader(gl, shader_src, shader_type) {
  const shader = gl.createShader(shader_type);
  gl.shaderSource(shader, shader_src);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const info = gl.getShaderInfoLog(shader);
    throw `Could not compile WebGL shaders. \n\n${info}`;
  }
  return shader;
}

function createProgam(gl, vshader, fshader) {
  var program = gl.createProgram();

  gl.attachShader(program, vshader);
  gl.attachShader(program, fshader); 
  gl.linkProgram(program); 

  var success = gl.getProgramParameter(program, gl.LINK_STATUS); 
  if (success) {
    return program;
  }

  // If it failed to compile 
  console.log(gl.getProgramInfoLog(program));
  gl.deleteProgram(program);
}

function create2dMesh(resolution) {
  // Building verts from left to right (-1 to 1)
  var h_step = 2/resolution; 
  var h_start = -1; 

  // Building verts from top down (1 to -1)
  var v_step = -h_step 
  var v_start = 1; 

  // Resolution = how many squares per row
  // meaning rez 1 requires 2 verts in a row / col
  var verts_per = resolution+1; 

  // Build linspace of vertices
  var verts = []
  for (var y=0; y<verts_per; y++) {
    for (var x=0; x<verts_per; x++) {
      vx = h_start + (x*h_step);
      vy = v_start + (y*v_step);
      verts.push(vx,vy);
    }
  }

  // Then tell it the order to use the indices in 
  var indices = []
  var cnt = 0
  for (var row=0; row<resolution; row++) {
    for (var col=0; col<resolution; col++) {
      start = row*verts_per + col; 
      mid = row*verts_per + col+1;
      other_mid = (row+1)*verts_per + col; 
      end = (row+1)*verts_per + col+1

      indices.push(start, mid, end, start, other_mid, end); 
      cnt += 6;
    }
  }

  return {
    'verts': verts, 
    'indices': indices, 
    't_cnt': cnt,
    'v_cnt': verts.length / 2
  }
}

function createBuffer(gl, program, name) {
  var positionBuffer = gl.createBuffer(); 
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
  var buf_ptr = gl.getAttribLocation(program, name); 
  gl.enableVertexAttribArray(buf_ptr);

  return buf_ptr
}

function get_random_colors(n_verts) {
  const colors = Array(n_verts * 3) // RGB

  for (var i=0; i<n_verts; i++) {
    for (var j=0; j<3; j++) {
        colors[i*3 + j] = Math.random();
    }
  }

  return new Float32Array(colors); 
}

function load_colors(colors, gl, c_buf) {
  // Put data into color buffer 
  gl.bindBuffer(gl.ARRAY_BUFFER, c_buf); 
  gl.bufferSubData(
    gl.ARRAY_BUFFER, 
    0,
    new Float32Array(colors)
  )
}

function set_transforms(gl, u_sx, u_sy, u_tx, u_ty) {
  gl.uniform1f(u_sx, sx);
  gl.uniform1f(u_sy, sy);
  gl.uniform1f(u_tx, tx);
  gl.uniform1f(u_ty, ty);
}

function set_complex(gl, u_cx, u_cy) {
  cx = document.getElementById('c-real').value; 
  cy = document.getElementById('c-imag').value; 

  gl.uniform1f(u_cx, cx); 
  gl.uniform1f(u_cy, cy); 
}

function set_lyapunov(gl, u_bin, u_len) {
  const seq = document.getElementById('lyap-str').value; 
  const bin_arr = to_binary_sequence(seq); 
  const arr_len = bin_arr.length; 

  gl.uniform1fv(u_bin, new Float32Array(bin_arr)); 
  gl.uniform1f(u_len, arr_len); 
}

function main() {
  const canvas = document.getElementById('glcanvas');
  const gl = canvas.getContext('webgl');

  if (gl == null) {
    alert ("Unable to init WebGL");
    return;
  }

  // So we can fiddle w the values in the fractal generator
  // on the user end
  var dynamic_frag = update_frag_vars(FRAG_SHADER); 

  // Shader src defined in shaders.js 
  const vert_shader = buildShader(gl, VERT_SHADER, gl.VERTEX_SHADER)
  const frag_shader = buildShader(gl, dynamic_frag, gl.FRAGMENT_SHADER)
  const program = createProgam(gl, vert_shader, frag_shader); 

  // Tell gl to use the shader program
  gl.useProgram(program);
  
  // After linking
  const u_sx = gl.getUniformLocation(program, "s_x");
  const u_sy = gl.getUniformLocation(program, "s_y");
  const u_tx = gl.getUniformLocation(program, "t_x");
  const u_ty = gl.getUniformLocation(program, "t_y");
  const u_cx = gl.getUniformLocation(program, "cx");
  const u_cy = gl.getUniformLocation(program, "cy");
  
  set_transforms(gl, u_sx, u_sy, u_tx, u_ty); 
  set_complex(gl, u_cx, u_cy); 

  // Only needed for Lyapunov
  if (last_frac == 'lyap') {
    const u_bin = gl.getUniformLocation(program, "u_values");
    const u_len = gl.getUniformLocation(program, "u_str_len");
    set_lyapunov(gl, u_bin, u_len); 
  }

  // Make webGL canvas size match what we defined <canvas> as
  resizeCanvas(gl); 

  // Black screen
  gl.clearColor(0,0,0,1);
  gl.clear(gl.COLOR_BUFFER_BIT);

  // Get pointers to variables in the shader
  var position_ptr = gl.getAttribLocation(program, 'a_position'); 
  var color_ptr = gl.getAttribLocation(program, 'a_color')

  // Create buffers 
  const p_buf = gl.createBuffer(); 
  const c_buf = gl.createBuffer();
  const idx_buf = gl.createBuffer();

  // Make triangles
  const v_data = create2dMesh(REZ);

  // Bind to position buffer 
  gl.bindBuffer(gl.ARRAY_BUFFER, p_buf)

  // Make the position_ptr the active variable 
  gl.enableVertexAttribArray(position_ptr);
  gl.vertexAttribPointer(position_ptr, 2, gl.FLOAT, false, 0, 0)

  // Put vertices into (active) position buffer
  gl.bufferData(
    gl.ARRAY_BUFFER,             
    new Float32Array(v_data.verts),  // Strongly typed array
    gl.STATIC_DRAW  // Compiler hint that we won't change data
  )

  // Bind to color buffer 
  gl.bindBuffer(gl.ARRAY_BUFFER, c_buf); 

  // Tell GL to use the color_ptr for this buffer 
  gl.enableVertexAttribArray(color_ptr);
  gl.vertexAttribPointer(color_ptr, 3, gl.FLOAT, false, 0, 0)

  // Tell GL to use the color_ptr for this buffer 
  gl.enableVertexAttribArray(color_ptr);
  gl.vertexAttribPointer(color_ptr, 3, gl.FLOAT, false, 0, 0)

  // Load dummy values into color buffer so we can just use "update" later
  const colors = get_random_colors(v_data.v_cnt)
  gl.bindBuffer(gl.ARRAY_BUFFER, c_buf);
  gl.bufferData(gl.ARRAY_BUFFER, colors, gl.DYNAMIC_DRAW);

  // Bind to the index buffer (do this before drawing)
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, idx_buf);

  // Put indices into element array buf
  gl.bufferData(
    gl.ELEMENT_ARRAY_BUFFER, 
    new Uint16Array(v_data.indices), 
    gl.STATIC_DRAW
  )

  // Tell gl to actually draw the points we made
  var primitiveType = gl.TRIANGLES; 
  var offset = 0; // Start at the beginning of the array
  var count = v_data.t_cnt; // Execute 3 times for 3 vertexes
  var indexType = gl.UNSIGNED_SHORT; 

  gl.drawElements(primitiveType, count, indexType, offset);
}