// Need special function to derive binary sequence 
// from arbitrary text input. Will encourage users 
// to input something binary, but can't guarantee it. 
// Instead, will map all new characters to !last_new_char
function to_binary_sequence(seq) {
    seq = seq.toLowerCase(); 
    var mapping = {}; 
    var last = 1; 

    out = [];
    for (i=0; i<seq.length; i++) {
        let key = seq[i];
        if (!(key in mapping)) {
            last = Math.abs(1-last); 
            mapping[key] = last; 
        }

        out.push(mapping[key]); 
    }

    // Must be non-trivial 
    if (out.length <= 1) {
        out = [0,1]; 
    }

    // WebGL can't handle arr[i % len] for some reason.
    // This isn't the most efficient way, but it will work 
    var true_out = []; 
    for (let i=0; i<shader_iters; i++) {
        true_out.push(out[i % out.length])
    }

    return true_out; 
}