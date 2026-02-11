// Disable cursor glow on touch / coarse pointer devices
var isCoarsePointer = window.matchMedia &&
  window.matchMedia('(pointer: coarse)').matches;

if (!isCoarsePointer) {
  document.addEventListener('pointermove', function (event) {
    var x = (event.clientX / window.innerWidth) * 100;
    var y = (event.clientY / window.innerHeight) * 100;

    document.documentElement.style.setProperty('--cursor-x', x + '%');
    document.documentElement.style.setProperty('--cursor-y', y + '%');
  });
} else {
  document.documentElement.style.setProperty('--cursor-x', '50%');
  document.documentElement.style.setProperty('--cursor-y', '50%');
}

// Mobile nav toggle
document.addEventListener('DOMContentLoaded', function () {
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.querySelector('.site-nav');
  if (!toggle || !nav) return;

  toggle.addEventListener('click', function () {
    nav.classList.toggle('is-open');
  });
});

