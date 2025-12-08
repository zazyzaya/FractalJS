const controls = document.getElementById('fractal-controls');
const header = controls.querySelector('.header');
let offsetX = 0, offsetY = 0, isDragging = false;

header.addEventListener('mousedown', (e) => {
  isDragging = true;
  offsetX = e.clientX - controls.offsetLeft;
  offsetY = e.clientY - controls.offsetTop;
  header.style.cursor = 'grabbing';
});

document.addEventListener('mousemove', (e) => {
  if (isDragging) {
    controls.style.left = (e.clientX - offsetX) + 'px';
    controls.style.top = (e.clientY - offsetY) + 'px';
  }
});

document.addEventListener('mouseup', () => {
  isDragging = false;
  header.style.cursor = 'move';
});

const fractalSelect = document.getElementById('fractal-type');
fractalSelect.addEventListener('change', (event) => {
  const value = event.target.value;
  
  c_div = document.getElementById("complex-selection")
  if (value == 'julia' || value == 'newton') {
    c_div.style.display = "flex"; 
  }
  else {
    c_div.style.display = "none"; 
  }

  img = document.getElementById('eq-img')
  img.src = 'img/' + value + '.png'

  main()
}); 

const boxes = document.querySelectorAll(".quick-change"); 
boxes.forEach(box => {
    box.addEventListener('change', () => { main(); })
})

const toggleButton = document.getElementById('toggle-panel');
const panelBody = document.querySelector('#fractal-controls .panel-body');

toggleButton.addEventListener('click', () => {
  if (panelBody.style.display === 'none') {
    panelBody.style.display = 'block';
  } else {
    panelBody.style.display = 'none';
  }
});