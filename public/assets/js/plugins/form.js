const form = document.getElementById('contactForm');

form.addEventListener('submit', function (event) {
    event.preventDefault();

    const nameField = document.getElementById('name').value;
    const nameError = document.getElementById('name-error');
    const nameRegex = /^[a-zA-Z\s]+$/; // Only letters and spaces allowed

    if (nameField.trim() === '' || !nameRegex.test(nameField)) {
        nameError.textContent = 'Please enter a valid name with only letters and spaces.';
        return false;
    }
    nameError.textContent = '';

    const emailField = document.getElementById('email').value;
    const emailError = document.getElementById('email-error');
    const emailRegex = /^\S+@\S+\.\S+$/; // 

    if (!emailRegex.test(emailField)) {
        emailError.textContent = 'Please enter a valid email address without spaces.';
        return false;
    }
    emailError.textContent = '';

    const phoneField = document.getElementById('phone').value;
    const phoneError = document.getElementById('phone-error');
    if (phoneField.trim().length !== 10) {
        phoneError.textContent = 'Please enter a valid  phone number.';
        return false;
    }
    phoneError.textContent = '';

    const passwordField = document.getElementById('password').value;
    const passwordError = document.getElementById('password-error');
    const passwordRegex = /^[a-zA-Z0-9_#]+$/;

    if (passwordField.trim() === '' || passwordField.length < 8 || passwordField.length >= 12 || !passwordRegex.test(passwordField)) {
        passwordError.textContent = 'Password should be between 8 and 11 characters and can only contain letters, numbers, underscores, or hashtags.';
        return false;
    }
    passwordError.textContent = '';

    const passwordField2 = document.getElementById('password1').value;
    const passwordError2 = document.getElementById('password1-error');
    if (passwordField2.trim() === '' || passwordField2.length < 8 || passwordField2.length >= 12) {
        passwordError2.textContent = 'Password should be between 8 and 11 characters.';
        return false;
    }
    passwordError2.textContent = '';
    if (passwordField !== passwordField2) {
        passwordError2.textContent = 'Passwords do not match.';
        return false;
    }
    passwordError2.textContent = '';

    // If all validations pass, submit the form
    this.submit();
});