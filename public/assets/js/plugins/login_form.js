
    function validateForm() {
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        let isValid = true;
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        const emailError = document.getElementById('email-error'); // Corrected the ID
        const passwordError = document.getElementById('passwordError');

        if (!email.match(emailPattern)) {
            emailError.innerText = 'Please enter a valid email address.';
            emailError.classList.add('error-message');
            isValid = false;
        } else {
            emailError.innerText = '';
        }
        if (password.length < 8) {
            passwordError.innerText = 'Password should be at least 8 characters long.';
            passwordError.classList.add('error-message');
            isValid = false;
        } else {
            passwordError.innerText = '';
        }

        return isValid;
    }


