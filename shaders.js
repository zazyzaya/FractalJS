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

var FRAG_SHADER = 
`// fragment shaders don't have a default precision so we need
// to pick one. mediump is a good default
precision mediump float;

varying vec4 v_color; 
varying vec2 v_xy;  // 0–1 pixel coordinates

// TODO use this instead
vec2 pow(float in_x, float in_y, int p) {
    float out_x=in_x; float out_y=in_y; 
    
    for (int i=0; i<2; i++) {
        out_x = out_x*in_x - out_y*in_y;
        out_y = out_y*in_x + out_x*in_y;
    }
    
    return vec2(out_x, out_y);
}

void main() {
    // gl_FragColor is a special variable a fragment shader
    // is responsible for setting

    float a = v_xy.x;   // real axis
    float b = v_xy.y;   // imaginary axis

    float z_a = a*a - b*b; 
    float z_b = 2.0*a*b; 
    
    const int max_iter = 100;
    const float escape = 4.0; 
    int n = 0; 

    for (int i=0; i<max_iter; i++) {
        float temp_a = z_a * z_a - z_b * z_b + a;
        float temp_b = 2.0 * z_a * z_b + b;

        z_a = temp_a;
        z_b = temp_b;

        if (z_a * z_a + z_b * z_b > escape) {
            break;
        }

        n++; 
    }

    float t= float(n) / float(max_iter); 
    gl_FragColor = vec4(
        0.25 + 0.75 * sin(3.0 + t * 5.0),
        1. - 0.5 * sin(1.0 + t * 5.0),
        0.5 + 0.5 * sin(2.0 + t * 5.0),
        1.
    );

    if (n==max_iter) {
        gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
    } 
}`