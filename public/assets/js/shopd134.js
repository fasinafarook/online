(function ($) {
    'use strict';
    /*Product Details*/
    var productDetails = function () {
        $('.product-image-slider').slick({
            slidesToShow: 1,
            slidesToScroll: 1,
            arrows: false,
            fade: false,
            asNavFor: '.slider-nav-thumbnails',
        });

        $('.slider-nav-thumbnails').slick({
            slidesToShow: 5,
            slidesToScroll: 1,
            asNavFor: '.product-image-slider',
            dots: false,
            focusOnSelect: true,
            prevArrow: '<button type="button" class="slick-prev"><i class="fi-rs-angle-left"></i></button>',
            nextArrow: '<button type="button" class="slick-next"><i class="fi-rs-angle-right"></i></button>'
        });

        // Remove active class from all thumbnail slides
        $('.slider-nav-thumbnails .slick-slide').removeClass('slick-active');

        // Set active class to first thumbnail slides
        $('.slider-nav-thumbnails .slick-slide').eq(0).addClass('slick-active');

        // On before slide change match active thumbnail to current slide
        $('.product-image-slider').on('beforeChange', function (event, slick, currentSlide, nextSlide) {
            var mySlideNumber = nextSlide;
            $('.slider-nav-thumbnails .slick-slide').removeClass('slick-active');
            $('.slider-nav-thumbnails .slick-slide').eq(mySlideNumber).addClass('slick-active');
        });

       
        $(document).ready(function() {
            // Preload images
            var imagesToPreload = [];
            $('.product-image-slider img').each(function(index, element) {
                imagesToPreload.push($(element).attr('src'));
            });
    
            // Function to preload images
            function preloadImages(images, callback) {
                var loadedImages = 0;
                var totalImages = images.length;
    
                images.forEach(function(imgSrc) {
                    var img = new Image();
                    img.onload = function() {
                        loadedImages++;
                        if (loadedImages === totalImages) {
                            callback();
                        }
                    };
                    img.src = imgSrc;
                });
            }
    
            // Preload images before initializing Elevate Zoom
            preloadImages(imagesToPreload, function() {
                // Initialize Elevate Zoom for each image
                $('.product-image-slider img').elevateZoom({
                    zoomType: "inner",
                    cursor: "crosshair",
                    zoomWindowFadeIn: 500,
                    zoomWindowFadeOut: 750
                });
    
                // Add event listeners for Slick slider changes
                $('.product-image-slider').on('beforeChange', function(event, slick, currentSlide, nextSlide) {
                    // Remove Elevate Zoom on change
                    $('.zoomContainer').remove();
                });
    
                $('.product-image-slider').on('afterChange', function(event, slick, currentSlide) {
                    // Reinitialize Elevate Zoom on the new active image
                    $('.product-image-slider .slick-active img').elevateZoom({
                        zoomType: "inner",
                        cursor: "crosshair",
                        zoomWindowFadeIn: 500,
                        zoomWindowFadeOut: 750
                    });
                });
            });
        });
    
    
    
       // Elevate Zoom
        if ( $(".product-image-slider").length ) {
            $('.product-image-slider .slick-active img').elevateZoom({
                zoomType: "inner",
                cursor: "crosshair",
                zoomWindowFadeIn: 500,
                zoomWindowFadeOut: 750
            });
        }
        
        //Filter color/Size
        $('.list-filter').each(function () {
            $(this).find('a').on('click', function (event) {
                event.preventDefault();
                $(this).parent().siblings().removeClass('active');
                $(this).parent().toggleClass('active');
                $(this).parents('.attr-detail').find('.current-size').text($(this).text());
                $(this).parents('.attr-detail').find('.current-color').text($(this).attr('data-color'));
            });
        });
        //Qty Up-Down
        $('.detail-qty').each(function () {
            var qtyval = parseInt($(this).find('.qty-val').text(), 10);
            $('.qty-up').on('click', function (event) {
                event.preventDefault();
                qtyval = qtyval + 1;
                $(this).prev().text(qtyval);
            });
            $('.qty-down').on('click', function (event) {
                event.preventDefault();
                qtyval = qtyval - 1;
                if (qtyval > 1) {
                    $(this).next().text(qtyval);
                } else {
                    qtyval = 1;
                    $(this).next().text(qtyval);
                }
            });
        });

        $('.dropdown-menu .cart_list').on('click', function (event) {
            event.stopPropagation();
        });
    };
    /* WOW active */
    new WOW().init();

    //Load functions
    $(document).ready(function () {
        productDetails();
    });

})(jQuery);