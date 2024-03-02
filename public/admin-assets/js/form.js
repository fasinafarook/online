document.getElementById('productForm').addEventListener('submit', function (event) {
    event.preventDefault();
    

    const pname = document.getElementById('product_name').value;
    if (pname.trim() === '') {
        document.getElementById('pnameError').textContent = 'Book Name is required.';
        return false;
    }

    const author = document.getElementById('author').value;
    if (author.trim() === '') {
        document.getElementById('authorError').textContent = 'Author name is required.';
        return false;
    }

    if (/\d/.test(author)) {
    document.getElementById('authorError').textContent = 'Author name should not be a numbers.';
    return false;
    }
    
    const description = document.getElementById('description').value;
    if (description.trim().length < 20) {
        document.getElementById('descriptionError').textContent = 'Description should be at least 20 characters.';
        return false;
    }
    
    const publisher = document.getElementById('publisher').value;
    if (publisher.trim() === '') {
        document.getElementById('publisherError').textContent = 'Publisher name is required.';
        return false;
    }

    if (/\d/.test(publisher)) {
    document.getElementById('publisherError').textContent = 'Publisher name should not be a numbers.';
    return false;
    }

    const aabout = document.getElementById('aabout').value;
    if (aabout.trim().length < 20) {
        document.getElementById('aaboutError').textContent = 'About the Author should be at least 20 characters.';
        return false;
    }

    const languageField = document.getElementById('language').value;
    const languageError = document.getElementById('language-error');
    const languageRegex = /^[a-zA-Z\s]+$/; // Only letters and spaces allowed

    if (languageField.trim() === '' || !languageRegex.test(languageField)) {
        languageError.textContent = 'Please enter a valid name with only letters and spaces.';
        return false;
    }
    languageError.textContent = '';

    const country = document.getElementById('country').value;
    if (country.trim() === '') {
        document.getElementById('countryError').textContent = ' Country is required.';
        return false;
    }

    const bweight = document.getElementById('bweight').value;
    if (bweight.trim() === '') {
        document.getElementById('bweightError').textContent = 'bweight is required.';
        return false;
    }

    if (isNaN(bweight)) {
        document.getElementById('bweightError').textContent = 'Book Weight should be a number.';
        return false;
    }

    if (bweight<0) {
        document.getElementById('bweightError').textContent = 'Book weight be a positive number.';
        return false;
    }
    const pages = document.getElementById('pages').value;
    if (pages.trim() === '') {
        document.getElementById('pagesError').textContent = 'pages is required.';
        return false;
    }

    if (isNaN(pages)) {
        document.getElementById('pagesError').textContent = 'Number of Pages should be a number.';
        return false;
    }

    if (pages<0) {
        document.getElementById('pagesError').textContent = 'Number of Pages should be a positive number.';
        return false;
    }

    const category = document.getElementById('category').value;
    if (category.trim() === '') {
        document.getElementById('categoryError').textContent = ' Category is required.';
        return false;
    }
    const quantity = document.getElementById('Quantity').value;
    if (quantity.trim() === '') {
        document.getElementById('quantityError').textContent = 'quantity is required.';
        return false;
    }

    if (isNaN(quantity)) {
        document.getElementById('quantityError').textContent = 'Quantity should be a number.';
        return false;
    }

    if (quantity<0) {
        document.getElementById('quantityError').textContent = 'Quantity should be a positive number.';
        return false;
    }
   
    const pprice = document.getElementById('price').value;

     if (pprice.trim() === '') {
        document.getElementById('ppriceError').textContent = 'Product price is required.';
        return false;
    }

    if (isNaN(pprice)) {
        document.getElementById('ppriceError').textContent = 'Regular Price should be a number.';
        return false;
    }

    if (pprice<0) {
        document.getElementById('ppriceError').textContent = 'Product Price should be a positive number.';
        return false;
    }

    const sprice = document.getElementById('sprice').value;
    if (sprice.trim() === '') {
        document.getElementById('spriceError').textContent = 'Sale price is required.';
        return false;
    }

    if (isNaN(sprice)) {
        document.getElementById('spriceError').textContent = 'Sale Price should be a number.';
        return false;
    }

    const spriceValue = parseFloat(sprice);
    const ppriceValue = parseFloat(pprice); 

    if (spriceValue > ppriceValue) {
        document.getElementById('spriceError').textContent = 'Sale Price should be less than product price.';
        return false;
    }

    if (sprice<0) {
        document.getElementById('spriceError').textContent = 'Sale Price should be a positive number.';
        return false;
    }
   

   
    
   

   

   

    
    // Trim white spaces from input values
    const fields = ['product_name',  'discription', 'publisher', 'About_author'];
    fields.forEach(field => {
        const element = document.getElementById(field);
        if (element) {
            element.value = element.value.trim();
        }
    });
   
    // Continue with form submission
    this.submit();
});

