document.addEventListener('pointermove', function (event) {
  var x = (event.clientX / window.innerWidth) * 100;
  var y = (event.clientY / window.innerHeight) * 100;

  document.documentElement.style.setProperty('--cursor-x', x + '%');
  document.documentElement.style.setProperty('--cursor-y', y + '%');
});

