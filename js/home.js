// Toggle the hamburger menu
const hamburger = document.getElementById('hamburger');
const dropdown = document.getElementById('dropdown');

hamburger.addEventListener('click', function() {
  this.classList.toggle('open');
  dropdown.classList.toggle('open');
});

// Toggle the contact detail on icon click
document.querySelectorAll('.contact-info .icon-container').forEach(function(icon) {
  icon.addEventListener('click', function() {
    // Toggle the clicked class to show/hide the contact detail
    icon.classList.toggle('clicked');
  });
});
