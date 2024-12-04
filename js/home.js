// Toggle the hamburger menu
const hamburger = document.getElementById('hamburger');
const dropdown = document.getElementById('dropdown');

hamburger.addEventListener('click', function() {
  this.classList.toggle('open');
  dropdown.classList.toggle('open');
});

// Function to copy text (phone number or email)
function copyText(type) {
  let textToCopy;
  
  if (type === 'phone') {
    textToCopy = '+91 9760496704';  // Mobile number
  } else if (type === 'email') {
    textToCopy = 'rohaan.saxena14@gmail.com';  // Email ID
  }

  // Create a temporary textarea to copy the text
  let textArea = document.createElement('textarea');
  textArea.value = textToCopy;
  document.body.appendChild(textArea);
  textArea.select();
  document.execCommand('copy');  // Copy the text
  document.body.removeChild(textArea);

  // Optionally, show an alert or notification to indicate success
  alert(`${type.charAt(0).toUpperCase() + type.slice(1)} copied to clipboard!`);
}