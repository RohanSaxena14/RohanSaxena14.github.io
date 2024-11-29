// Toggle the hamburger menu
const hamburger = document.getElementById('hamburger');
const dropdown = document.getElementById('dropdown');

hamburger.addEventListener('click', function() {
  this.classList.toggle('open');
  dropdown.classList.toggle('open');
});
