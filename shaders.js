var VERT_SHADER = 
`// an attribute will receive data from a buffer
attribute vec4 a_position;
attribute vec4 a_color; 

varying vec4 v_color; 
varying vec2 v_xy; 

// Transform values
uniform float s_x;
uniform float s_y;
uniform float t_x;
uniform float t_y;

// all shaders have a main function
void main() {

    // gl_Position is a special variable a vertex shader
    // is responsible for setting
    gl_Position = vec4(a_position.xy, 0,1);

    // Affine transform
    mat3 M = mat3(
        vec3(s_x, 0., 0.), 
        vec3(0., s_y, 0.), 
        vec3(t_x, t_y, 1.)
    );

    v_xy = (M * vec3(a_position.xy,1.)).xy;   // pass XY to fragment
    v_color = a_color; 
}`

var MANDEL_SHADER = 
`// fragment shaders don't have a default precision so we need
// to pick one. mediump is a good default
precision mediump float;

varying vec4 v_color; 
varying vec2 v_xy;  // 0–1 pixel coordinates
const int MAX_P = 100; 

vec2 complex_mult(vec2 a, vec2 b) {
    vec2 out_v; 
    out_v.x = a.x * b.x - a.y * b.y;
    out_v.y = a.y * b.x + a.x * b.y;

    return out_v; 
}

vec2 complex_pow(vec2 in_v, int p) {
    vec2 out_v = vec2(in_v.xy); 

    for (int i=1; i<MAX_P; i++) {
        if (i >= p) { break; }
        out_v = complex_mult(in_v, out_v); 
    }
    
    return out_v; 
}

void main() {
    // gl_FragColor is a special variable a fragment shader
    // is responsible for setting
    vec2 z = vec2(v_xy); 
    
    const int max_iter = [[MAX_ITER]];
    const float escape = 4.0; 
    int n = 0; 
    vec2 z_pow; 

    for (int i=0; i<max_iter; i++) {
        z_pow = complex_pow(z, [[POW]]); 
        z = z_pow + v_xy; 

        if (z.x * z.x + z.y * z.y > escape) {
            break;
        }

        n++; 
    }

    float t= float(n) / float(max_iter); 
    gl_FragColor = vec4(
        0.25 + 0.75 * sin(t * 5.0),
        1. - 0.5 * sin(1.0 + t * 5.0),
        0.5 + 0.5 * sin(2.0 + t * 5.0),
        1.
    );

    if (n==max_iter) {
        gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
    } 
}`

var JULIA_SHADER = `// fragment shaders don't have a default precision so we need
// to pick one. mediump is a good default
precision mediump float;

uniform float cx; 
uniform float cy; 

varying vec4 v_color; 
varying vec2 v_xy;  // 0–1 pixel coordinates

const int MAX_P = 100; 

vec2 complex_mult(vec2 a, vec2 b) {
    vec2 out_v; 
    out_v.x = a.x * b.x - a.y * b.y;
    out_v.y = a.y * b.x + a.x * b.y;

    return out_v; 
}

vec2 complex_pow(vec2 in_v, int p) {
    vec2 out_v = vec2(in_v.xy); 

    for (int i=1; i<MAX_P; i++) {
        if (i >= p) { break; }
        out_v = complex_mult(in_v, out_v); 
    }
    
    return out_v; 
}

void main() {
    // gl_FragColor is a special variable a fragment shader
    // is responsible for setting
    vec2 z = vec2(v_xy); 
    vec2 c = vec2(cx, cy); 
    
    const int max_iter = [[MAX_ITER]];
    const float escape = 4.0; 
    int n = 0; 
    vec2 z_pow; 

    for (int i=0; i<max_iter; i++) {
        z_pow = complex_pow(z, [[POW]]); 
        z = z_pow + c; 

        if (z.x * z.x + z.y * z.y > escape) {
            break;
        }

        n++; 
    }

    float t= float(n) / float(max_iter); 
    gl_FragColor = vec4(
        0.25 + 0.75 * sin(t * 5.0),
        1. - 0.5 * sin(1.0 + t * 5.0),
        0.5 + 0.5 * sin(2.0 + t * 5.0),
        1.
    );

    if (n==max_iter) {
        gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
    } 
}`

var NEWTON_SHADER = `// fragment shaders don't have a default precision so we need
// to pick one. mediump is a good default
precision mediump float;

uniform float cx; 
uniform float cy; 

varying vec4 v_color; 
varying vec2 v_xy;  // 0–1 pixel coordinates

const int MAX_P = 100; 

vec2 complex_mult(vec2 a, vec2 b) {
    vec2 out_v; 
    out_v.x = a.x * b.x - a.y * b.y;
    out_v.y = a.y * b.x + a.x * b.y;

    return out_v; 
}

vec2 complex_pow(vec2 in_v, int p) {
    vec2 out_v = vec2(in_v.xy); 

    for (int i=1; i<MAX_P; i++) {
        if (i >= p) { break; }
        out_v = complex_mult(in_v, out_v); 
    }
    
    return out_v; 
}

vec2 complex_divide(vec2 numer, vec2 denom) {
    vec2 conjugate = vec2(denom.x, -denom.y); 
    numer = complex_mult(numer, conjugate); 
    denom = complex_mult(denom, conjugate); 

    numer.x = numer.x / denom.x; 
    numer.y = numer.y / denom.x; // No imaginary part

    return numer; 
}

void main() {
    // gl_FragColor is a special variable a fragment shader
    // is responsible for setting
    vec2 z = vec2(v_xy); 
    vec2 c = vec2(cx, cy); 
    
    const int max_iter = [[MAX_ITER]];
    const float escape = 4.0; 
    int n = 0; 
    vec2 z_numer, z_denom; 

    for (int i=0; i<max_iter; i++) {
        z_numer = complex_pow(z, [[POW]]); 
        z_numer.x = z_numer.x - cx; 
        z_numer.y = z_numer.y - cy; 

        z_denom = [[POW]].0 * complex_pow(z, [[POW]]-1); 
        z_numer = complex_divide(z_numer, z_denom); 

        z = z - z_numer; 
    }

    gl_FragColor = vec4(
        sin(z.x),
        sin(z.x),
        sin(z.y),
        1.
    );

    if (n==max_iter) {
        gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
    } 
}`

var BURNING_SHIP = `// fragment shaders don't have a default precision so we need
// to pick one. mediump is a good default
precision mediump float;

uniform float cx; 
uniform float cy; 

varying vec4 v_color; 
varying vec2 v_xy;  // 0–1 pixel coordinates

const int MAX_P = 100; 

vec2 complex_mult(vec2 a, vec2 b) {
    vec2 out_v; 
    out_v.x = a.x * b.x - a.y * b.y;
    out_v.y = a.y * b.x + a.x * b.y;

    return out_v; 
}

vec2 complex_pow(vec2 in_v, int p) {
    vec2 out_v = vec2(in_v.xy); 

    for (int i=1; i<MAX_P; i++) {
        if (i >= p) { break; }
        out_v = complex_mult(in_v, out_v); 
    }
    
    return out_v; 
}

vec2 complex_divide(vec2 numer, vec2 denom) {
    vec2 conjugate = vec2(denom.x, -denom.y); 
    numer = complex_mult(numer, conjugate); 
    denom = complex_mult(denom, conjugate); 

    numer.x = numer.x / denom.x; 
    numer.y = numer.y / denom.x; // No imaginary part

    return numer; 
}

void main() {
    // gl_FragColor is a special variable a fragment shader
    // is responsible for setting
    vec2 c = vec2(v_xy.x, -v_xy.y);
    vec2 z = vec2(c); 
    
    const int max_iter = [[MAX_ITER]];
    const float escape = 4.0; 
    int n = 0; 
    vec2 tmp; 
    float modulus; 

    for (int i=0; i<max_iter; i++) {
        tmp.x = abs(z.x); 
        tmp.y = abs(z.y); 
        z = complex_pow(tmp, [[POW]]) + c; 

        modulus = z.x * z.x + z.y * z.y;
        if (modulus > escape) {
            break;
        }

        n++; 
    }

    /*
    modulus = sqrt(modulus); 
    float t = float(n) - (log(log(modulus))) / log(2.); 
    gl_FragColor = vec4(
        sin(t),
        sin(1.0 + t),
        sin(2.0 + t),
        1.
    );
    */


    float t = float(n) / float(max_iter); 
    gl_FragColor = vec4(
        0.25 + 0.75 * sin(t * 5.0),
        1. - 0.5 * sin(1.0 + t * 5.0),
        0.5 + 0.5 * sin(2.0 + t * 5.0),
        1.
    );

    if (n==max_iter) {
        gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
    } 
}`

var LYAPUNYAV_SHADER = `
precision mediump float;

uniform float cx; 
uniform float cy; 

// No way to pass bools. Oh well 
const int MAX_LEN = 256;
uniform float u_values[MAX_LEN];
uniform float u_str_len; 

varying vec4 v_color; 
varying vec2 v_xy;  // 0–1 pixel coordinates

const int MAX_P = 100; 

void main() {
    // gl_FragColor is a special variable a fragment shader
    // is responsible for setting
    if (v_xy.x > 4. || v_xy.y > 4. || v_xy.x < 0. || v_xy.y < 0.) {
        gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
        return; 
    }

    float x = cx; 
    float r_i; 
    int seq_len = int(u_str_len); 

    // Do one round without logs for stability
    for (int i=0; i<MAX_LEN; i++) {
        if (i == seq_len) { break; }

        if (int(u_values[i]) == 1) {
            r_i = v_xy.x; 
        }
        else {
            r_i = v_xy.y;
        }
        x = r_i * x * (1.-x); 
    }
    
    const int max_iter = [[MAX_ITER]];
    float sum_log_deriv = 0.;
    float prod_deriv;  

    for (int i=0; i<max_iter; i++) {
        prod_deriv = 1.; 

        // Iterate through full string
        for (int i=0; i<MAX_LEN; i++) {
            if (i == seq_len) { break; }

            if (int(u_values[i]) == 1) {
                r_i = v_xy.x; 
            }
            else {
                r_i = v_xy.y;
            }
            prod_deriv *= r_i * (1.-2.*x);
            x = r_i * x * (1.-x); 
        }
        sum_log_deriv += log(abs(prod_deriv)); 
    }
    
    float lambda = sum_log_deriv / (float(max_iter)*u_str_len); 

    // Copying code from https://github.com/RokerHRO/lyapunov/
    // for coloring algo 
    float lambda_min = -2.55;
    float lambda_max = 0.3959;

    if (lambda > 0.) { 
        gl_FragColor = vec4(
            0., 0., lambda / lambda_max, 1
        );
    } else {
        float r = 1. - pow(lambda/lambda_min, 2./3.); 
        float g = 1. - pow(lambda/lambda_min, 1./3.); 
        gl_FragColor = vec4(r,g,0.,1.);
    }
    
    /*
    float t = lambda / float(max_iter - skip_iter); 
    if (lambda > 0.) {
        gl_FragColor = vec4(
            0.25 + 0.75 * sin(t * 5.0),
            1. - 0.5 * sin(1.0 + t * 5.0),
            0.5 + 0.5 * sin(2.0 + t * 5.0),
            1.
        );
    } else {
        gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
    }
    */
    
}`

var FRAG_SHADER = MANDEL_SHADER