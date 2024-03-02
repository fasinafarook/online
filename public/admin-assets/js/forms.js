const categoryForm = document.getElementById('categoryform');

        categoryForm.addEventListener('submit', function (event) {
            event.preventDefault();
        
            const nameField = document.getElementById('names').value;
            const nameError = document.getElementById('names-error');
            const nameRegex = /^[a-zA-Z\s]+$/; // Only letters and spaces allowed
        
            if (nameField.trim() === '' || !nameRegex.test(nameField.trim())) {
                nameError.textContent = 'Please enter a valid name with only letters and spaces.';
                return false;
            }
            nameError.textContent = '';

            // Trim white spaces from input values
    const fields = ['names'];
    fields.forEach(field => {
        const element = document.getElementById(field);
        if (element) {
            element.value = element.value.trim();
        }
    });
   
    
            this.submit();
        });
       