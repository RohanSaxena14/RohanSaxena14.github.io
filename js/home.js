// Toggle the hamburger menu
const hamburger = document.getElementById('hamburger');
const dropdown = document.getElementById('dropdown');

hamburger.addEventListener('click', function() {
  this.classList.toggle('open');
  dropdown.classList.toggle('open');
});

// Toggle the contact detail on icon click/touch
document.querySelectorAll('.contact-info .icon-container').forEach(function(icon) {
  icon.addEventListener('click', function(event) {
    // Toggle the clicked class to show/hide the contact detail
    icon.classList.toggle('clicked');

    // Prevent default action if it's a link and stop event propagation for better usability
    event.preventDefault();
    event.stopPropagation();
  });
});

// Optionally, add a "touchstart" event for better mobile responsiveness
document.querySelectorAll('.contact-info .icon-container').forEach(function(icon) {
  icon.addEventListener('touchstart', function(event) {
    // Toggle the clicked class to show/hide the contact detail
    icon.classList.toggle('clicked');
    
    // Prevent default action and stop event propagation to ensure the interaction works smoothly on mobile
    event.preventDefault();
    event.stopPropagation();
  });
});
