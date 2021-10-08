(function ($) {
    var windowObj = $(window);

    // Slick slider settings
    var slickSettingsElement = $('#spc-slick-slider-settings');
    var showProductInCarousel = slickSettingsElement.attr('data-showitemsincarousel');
    var slickCategorySettings = slickSettingsElement.attr('data-slickcategorysettings');
    var slickProductSettings = slickSettingsElement.attr("data-slickproductsettings");
    var categoryResponsiveBreakpoints = slickSettingsElement.attr('data-categoryresponsivebreakpoints');
    var productResponsiveBreakpoints = slickSettingsElement.attr('data-productresponsivebreakpoints');

    var checkIfAllGroupsAreLoaded = function () {
        if ($('.spc-products[notLoaded], .spc-categories[notLoaded]').length === 0) {
            windowObj.off('scroll.smart-products');
        }
    };

    var loadTabsIfVisible = function () {
        var currentScrollTop = windowObj.scrollTop() + windowObj.outerHeight();

        $('.spc-products[notLoaded]').each(function () {
            var that = $(this);

            if (that.offset().top < currentScrollTop) {
                that.removeAttr('notLoaded');
                that.find('.tab:first').click();
            }
        });

        $('.spc-categories[notLoaded]').each(function () {
            var that = $(this);

            if (that.offset().top < currentScrollTop) {
                that.removeAttr('notLoaded');

                $.ajax({
                    cache: false,
                    url: that.attr('data-getCategoryGroupInfoUrl'),
                    type: 'POST',
                    data: {
                        'categoryId': parseInt(that.attr('data-categoryGroupId')) || 0
                    }
                }).done(function (data) {
                    that.html(data);

                    // Show first tab contents
                    that.find('.navigation .tab:first-of-type').removeAttr('notLoaded').addClass('active');
                    that.find('.category-products .category-product-grid:first-of-type').addClass('active');

                    var containerElement = that.find('.item-grid:first');
                    if (showProductInCarousel && containerElement.length && containerElement.find('.item-box').length > 0) {
                        initilizeSlickSlider(containerElement, 'category');
                    } else {
                        $.event.trigger({ type: "newProductsAddedToPageEvent" });
                    }
                }).fail(function () {
                    that.remove();
                });
            }
        });

        checkIfAllGroupsAreLoaded();
    };

    var initializeTabsFunctionality = function () {
        // products
        $('.spc-products .tab').off('click.smartproductcollections').on('click.smartproductcollections', function (e) {
            e.preventDefault();

            var that = $(this);
            var tabId = parseInt(that.attr('data-tabId'));

            if (isNaN(tabId)) {
                return;
            }

            var smartProductCollections = that.closest('.spc-products');
            var newActiveTab = smartProductCollections.find('.spc-body .product-grid[data-tabId="' + tabId + '"]');

            if (that.hasClass('loaded')) {
                that.addClass('active').siblings('.tab').removeClass('active');

                smartProductCollections.find('.spc-body .product-grid[data-tabId="' + tabId + '"]').addClass('active').siblings('.product-grid').removeClass('active');
                
                // Fixes a problem when resizing the window and then change the tab. The slick slider need to be resized.
                if (newActiveTab.find('.item-grid').hasClass('slick-initialized')) {
                    newActiveTab.find('.item-grid').slick('setPosition');
                }
            } else {
                that.addClass('loaded');
                smartProductCollections.find('.loading-overlay').show();

                $.ajax({
                    cache: false,
                    url: smartProductCollections.attr('data-getItemProductsUrl'),
                    type: 'POST',
                    data: {
                        'id': tabId
                    }
                }).done(function (data) {
                    newActiveTab.find('.item-grid').html(data);

                    that.addClass('active').siblings('.tab').removeClass('active');
                    newActiveTab.addClass('active').siblings('.product-grid').removeClass('active');

                    var containerElement = newActiveTab.find('.item-grid');
                    if (showProductInCarousel && containerElement.length && containerElement.find('.item-box').length > 0) {
                        initilizeSlickSlider(containerElement, 'product', smartProductCollections);
                    } else {
                        onImagesLoaded(newActiveTab, smartProductCollections);

                        $.event.trigger({ type: "newProductsAddedToPageEvent" });
                    }
                });
            }
        });

        $('.spc-products').on('change', '.mobile-navigation select', function () {
            var that = $(this);

            that.closest('.spc-products').find('.navigation .tab[data-tabId="' + that.val() + '"]').click();
        });

        // categories
        $('.spc-categories').on('click', '.navigation .tab', function () {
            var that = $(this);
            var tabId = parseInt(that.attr('data-tabId')) || 0;
            var thatCategoryGroup = that.closest('.spc-categories');
            var categoryId = parseInt(thatCategoryGroup.attr('data-categoryGroupId')) || 0;
            var thatContent = thatCategoryGroup.find('.category-products .category-product-grid[data-tabId="' + tabId + '"]');

            if (that.is('[notLoaded]')) {
                that.removeAttr('notLoaded');

                thatCategoryGroup.find('.loading-overlay').show();

                $.ajax({
                    cache: false,
                    url: thatCategoryGroup.attr('data-getItemProductsUrl'),
                    type: 'POST',
                    data: {
                        'id': tabId,
                        'categoryId': categoryId
                    }
                }).done(function (data) {
                    thatContent.children('.item-grid').html(data);

                    that.addClass('active').siblings('.tab').removeClass('active');
                    thatContent.addClass('active').siblings('.category-product-grid').removeClass('active');

                    var containerElement = thatContent.find('.item-grid');
                    if (showProductInCarousel && containerElement.length && containerElement.find('.item-box').length > 0) {
                        initilizeSlickSlider(containerElement, 'category', thatCategoryGroup);
                    } else {
                        onImagesLoaded(thatContent, thatCategoryGroup);

                        $.event.trigger({ type: "newProductsAddedToPageEvent" });
                    }
                });
            } else {
                that.addClass('active').siblings('.tab').removeClass('active');
                thatContent.addClass('active').siblings('.category-product-grid').removeClass('active');

                // Fixes a problem when resizing the window and then change the tab. The slick slider need to be resized.
                if (thatContent.find('.item-grid').hasClass('slick-initialized')) {
                    thatContent.find('.item-grid').slick('setPosition');
                }
            }

            thatCategoryGroup.find('.category-mobile-navigation-select option[value="' + tabId + '"]').attr('selected', 'selected');
        });

        $('.spc-categories').on('change', '.mobile-navigation select', function () {
            var that = $(this);

            that.closest('.spc-categories').find('.navigation .tab[data-tabId="' + that.val() + '"]').click();
        });
    };

    function initilizeSlickSlider(containerElement, type, collectionElement) {
        // If the carousel is already initialized we shouldn't init it again.
        if (!containerElement.length || containerElement.hasClass('slick-initialized') || containerElement.find('.item-box').length == 0) {
            return;
        }

        var slickSettingsParsed = {};

        // Parse Slick settings
        try {
            if (type == 'category') {
                slickSettingsParsed = JSON.parse(slickCategorySettings);
            } else {
                slickSettingsParsed = JSON.parse(slickProductSettings);
            }
        }
        catch (e) {
            console.log('Invalid category/product collection settings value!');
        }

        // Parse breakpoints / responsive settings.
        try {
            if (type == 'category') {
                slickSettingsParsed.responsive = JSON.parse(categoryResponsiveBreakpoints);
            } else {
                slickSettingsParsed.responsive = JSON.parse(productResponsiveBreakpoints);
            }
        }
        catch (e) {
            console.log('Invalid category/product breakpoints setting value!');
        }

        containerElement.on('init', function () {
            if (collectionElement) {
                onImagesLoaded(containerElement, collectionElement);
            }

            $.event.trigger({ type: "newProductsAddedToPageEvent" });
        });

        slickSettingsParsed.rtl = $("html").attr("dir") == "rtl";
        containerElement.slick(slickSettingsParsed);
    }

    // this function selects a container 
    // and throws an event when all the images in that container have been loaded
    function onImagesLoaded(containerSelector, collectionElement) {

        var imagesInContainer = $('img', containerSelector);
        var imagesInCountainerCount = imagesInContainer.length;

        if (imagesInCountainerCount === 0) {
            collectionElement.find('.loading-overlay').fadeOut();
        }

        imagesInContainer.load(function () {

            imagesInCountainerCount--;

            if (imagesInCountainerCount <= 0) {

                collectionElement.find('.loading-overlay').fadeOut();
            }
        });
    }

    $(document).ready(function () {
        initializeTabsFunctionality();

        setTimeout(loadTabsIfVisible, 200);

        windowObj.on('scroll.smart-products', loadTabsIfVisible);
    });
})(jQuery);