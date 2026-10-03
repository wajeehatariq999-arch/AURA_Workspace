/* =========================================================
   AURA - CUSTOMER STOREFRONT
   Complete customer.js
   ========================================================= */

(() => {
    "use strict";


    /* =========================================================
       SAVE ORIGINAL AURA FUNCTIONS
       ========================================================= */

    const auraOriginalRoute =
        typeof window.route === "function"
            ? window.route
            : null;

    const auraOriginalSetAuthMode =
        typeof window.setAuthMode === "function"
            ? window.setAuthMode
            : null;


    /* =========================================================
       CUSTOMER STATE
       ========================================================= */

    let customerSelectedCategory = "All Products";
    let customerCart = [];


    /* =========================================================
       CUSTOMER CATEGORIES
       ========================================================= */

    const CUSTOMER_CATEGORIES = [
        {
            name: "Fashion & Clothing",
            icon: "👗",
            aliases: [
                "fashion",
                "clothing",
                "fashion & clothing",
                "fashion and clothing",
                "apparel",
                "clothes"
            ]
        },

        {
            name: "Shoes & Footwear",
            icon: "👟",
            aliases: [
                "shoes",
                "shoe",
                "footwear",
                "shoes & footwear",
                "shoes and footwear"
            ]
        },

        {
            name: "Jewellery & Accessories",
            icon: "💎",
            aliases: [
                "jewellery",
                "jewelry",
                "accessories",
                "jewellery & accessories",
                "jewellery and accessories"
            ]
        },

        {
            name: "Home & Living",
            icon: "🏠",
            aliases: [
                "home",
                "living",
                "home & living",
                "home and living",
                "home decor",
                "decor"
            ]
        },

        {
            name: "Bags",
            icon: "👜",
            aliases: [
                "bag",
                "bags",
                "handbag",
                "handbags"
            ]
        },

        {
            name: "Beauty & Personal Care",
            icon: "💄",
            aliases: [
                "beauty",
                "personal care",
                "beauty & personal care",
                "beauty and personal care",
                "cosmetics",
                "makeup"
            ]
        },

        {
            name: "Electronics & Gadgets",
            icon: "🎧",
            aliases: [
                "electronics",
                "gadgets",
                "electronics & gadgets",
                "electronics and gadgets",
                "technology",
                "tech"
            ]
        },

        {
            name: "Gifts & Lifestyle",
            icon: "🎁",
            aliases: [
                "gift",
                "gifts",
                "lifestyle",
                "gifts & lifestyle",
                "gifts and lifestyle"
            ]
        }
    ];


    /* =========================================================
       GENERAL HELPERS
       ========================================================= */

    function escapeHtml(value) {

        if (
            typeof window.esc === "function"
        ) {
            return window.esc(value);
        }

        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }


    function money(value) {

        try {

            if (
                typeof window.money === "function"
            ) {
                return window.money(value);
            }

        } catch {}

        return Number(value || 0).toFixed(2);
    }


    function showToast(message, type = "info") {

        if (
            typeof window.toast === "function"
        ) {
            window.toast(message, type);
            return;
        }

        console.log(message);
    }


    function closeCustomerModal() {

        if (
            typeof window.closeModal === "function"
        ) {
            window.closeModal();
        }
    }


    function openCustomerModal(html) {

        if (
            typeof window.openModal === "function"
        ) {
            window.openModal(html);
            return true;
        }

        return false;
    }


    /* =========================================================
       CATEGORY HELPERS
       ========================================================= */

    function normalizeCategory(value) {

        return String(value || "")
            .trim()
            .toLowerCase()
            .replace(/&/g, "and")
            .replace(/\s+/g, " ");
    }


    function categoryMatches(
        productCategory,
        selectedCategory
    ) {

        if (
            !selectedCategory ||
            selectedCategory === "All Products"
        ) {
            return true;
        }


        const productValue =
            normalizeCategory(productCategory);

        const selectedValue =
            normalizeCategory(selectedCategory);


        if (!productValue) {
            return false;
        }


        if (
            productValue === selectedValue
        ) {
            return true;
        }


        const selectedObject =
            CUSTOMER_CATEGORIES.find(
                category =>
                    normalizeCategory(
                        category.name
                    ) === selectedValue
            );


        if (!selectedObject) {
            return false;
        }


        return selectedObject.aliases.some(
            alias =>
                normalizeCategory(alias) ===
                productValue
        );
    }


    /* =========================================================
       PRODUCT DATA
       ========================================================= */

    function getCustomerProducts() {

        try {

            if (
                typeof productsCache !==
                    "undefined" &&
                Array.isArray(productsCache)
            ) {
                return productsCache;
            }

        } catch {}

        return [];
    }


    function getProductCategory(product) {

        return (
            product?.category ||
            product?.category_name ||
            product?.categoryName ||
            ""
        );
    }


    function getProductStock(product) {

        return Number(
            product?.inventory?.quantity ??
            product?.stock_quantity ??
            product?.stock ??
            0
        );
    }


    function isProductAvailable(product) {

        return (
            product?.is_available !== false &&
            getProductStock(product) > 0
        );
    }


    /* =========================================================
       PRODUCT IMAGES
       ========================================================= */

    function getProductImage(product) {

        if (!product) {
            return null;
        }


        if (
            Array.isArray(product.images) &&
            product.images.length
        ) {

            const primary =
                product.images.find(
                    image =>
                        image.is_primary
                ) ||
                product.images[0];


            if (
                primary &&
                primary.url
            ) {
                return primary.url;
            }
        }


        if (product.image_url) {
            return product.image_url;
        }


        if (product.image) {
            return product.image;
        }


        return null;
    }


    function productImageMarkup(product) {

        const image =
            getProductImage(product);

        const name =
            product?.name ||
            "AURA Product";


        if (!image) {

            return `
                <div class="customer-product-image">

                    <div
                        class="customer-image-fallback"
                    >
                        <span>✦</span>

                        <strong>
                            AURA
                        </strong>

                        <small>
                            ${escapeHtml(name)}
                        </small>
                    </div>

                </div>
            `;
        }


        return `
            <div class="customer-product-image">

                <img
                    class="customer-product-img"
                    src="${escapeHtml(image)}"
                    alt="${escapeHtml(name)}"
                >

                <div
                    class="customer-image-fallback"
                    style="display:none;"
                >
                    <span>✦</span>

                    <strong>
                        AURA
                    </strong>

                    <small>
                        ${escapeHtml(name)}
                    </small>
                </div>

            </div>
        `;
    }


    function setupImageFallbacks(root) {

        if (!root) {
            return;
        }


        root
            .querySelectorAll(
                ".customer-product-img"
            )
            .forEach(image => {

                image.addEventListener(
                    "error",
                    () => {

                        image.style.display =
                            "none";


                        const fallback =
                            image.parentElement
                                ?.querySelector(
                                    ".customer-image-fallback"
                                );


                        if (fallback) {

                            fallback.style.display =
                                "flex";
                        }
                    }
                );

            });
    }


    /* =========================================================
       CART STORAGE
       ========================================================= */

    function cartStorageKey() {

        let userId = "guest";
        let businessId = "store";


        try {

            if (
                typeof me !== "undefined" &&
                me?.id
            ) {
                userId =
                    String(me.id);
            }

        } catch {}


        try {

            if (
                typeof biz !== "undefined" &&
                biz?.id
            ) {
                businessId =
                    String(biz.id);
            }

        } catch {}


        return (
            "aura_customer_cart_" +
            businessId +
            "_" +
            userId
        );
    }


    function loadCustomerCart() {

        try {

            const raw =
                localStorage.getItem(
                    cartStorageKey()
                );


            if (!raw) {

                customerCart = [];
                return;
            }


            const parsed =
                JSON.parse(raw);


            customerCart =
                Array.isArray(parsed)
                    ? parsed
                    : [];

        } catch {

            customerCart = [];
        }
    }


    function saveCustomerCart() {

        try {

            localStorage.setItem(
                cartStorageKey(),
                JSON.stringify(
                    customerCart
                )
            );

        } catch {}
    }


    function cartCount() {

        return customerCart.reduce(
            (total, item) =>
                total +
                Number(
                    item.quantity || 0
                ),
            0
        );
    }


    function cartTotal() {

        return customerCart.reduce(
            (total, item) =>
                total +
                Number(item.price || 0) *
                Number(item.quantity || 0),
            0
        );
    }


    function findCartItem(productId) {

        return customerCart.find(
            item =>
                Number(item.product_id) ===
                Number(productId)
        );
    }


    /* =========================================================
       CATEGORY UI
       ========================================================= */

    function categoryButton(category) {

        const active =
            customerSelectedCategory ===
            category.name;


        return `
            <button
                type="button"
                class="customer-category ${
                    active ? "active" : ""
                }"
                data-category="${escapeHtml(
                    category.name
                )}"
                aria-pressed="${
                    active
                        ? "true"
                        : "false"
                }"
            >

                <span
                    class="customer-category-icon"
                >
                    ${category.icon}
                </span>

                <span
                    class="customer-category-name"
                >
                    ${escapeHtml(
                        category.name
                    )}
                </span>

            </button>
        `;
    }


    function renderCustomerCategories() {

        const root =
            document.querySelector(
                "#customer-categories"
            );


        if (!root) {
            return;
        }


        root.innerHTML = `

            <button
                type="button"
                class="customer-category ${
                    customerSelectedCategory ===
                    "All Products"
                        ? "active"
                        : ""
                }"
                data-category="All Products"
                aria-pressed="${
                    customerSelectedCategory ===
                    "All Products"
                        ? "true"
                        : "false"
                }"
            >

                <span
                    class="customer-category-icon"
                >
                    ✦
                </span>

                <span
                    class="customer-category-name"
                >
                    All Products
                </span>

            </button>

            ${CUSTOMER_CATEGORIES
                .map(categoryButton)
                .join("")}
        `;


        /*
         * IMPORTANT:
         * No inline onclick is used.
         * This makes the category buttons work
         * even when browser/CSP blocks inline handlers.
         */

        root.onclick =
            event => {

                const button =
                    event.target.closest(
                        ".customer-category[data-category]"
                    );


                if (!button) {
                    return;
                }


                selectCustomerCategory(
                    button.dataset.category
                );
            };
    }


    function selectCustomerCategory(
        categoryName
    ) {

        customerSelectedCategory =
            categoryName ||
            "All Products";


        renderCustomerCategories();
        renderCustomerProducts();
        updateProductsHeading();
    }


    window.selectCustomerCategory =
        selectCustomerCategory;


    /* =========================================================
       FILTER PRODUCTS
       ========================================================= */

    function getFilteredCustomerProducts() {

        return getCustomerProducts()
            .filter(product => {

                return categoryMatches(
                    getProductCategory(
                        product
                    ),
                    customerSelectedCategory
                );
            });
    }


    /* =========================================================
       PRODUCT CARD
       ========================================================= */

    function productCard(product) {

        const productId =
            Number(product.id);


        const existingCartItem =
            findCartItem(productId);


        const cartQuantity =
            existingCartItem
                ? Number(
                    existingCartItem.quantity
                )
                : 0;


        const available =
            isProductAvailable(
                product
            );


        const category =
            getProductCategory(
                product
            );


        return `
            <article
                class="customer-product-card"
                data-product-card="${productId}"
            >

                ${productImageMarkup(
                    product
                )}


                <div
                    class="customer-product-info"
                >

                    <div
                        class="customer-product-category"
                    >
                        ${escapeHtml(
                            category ||
                            "AURA Collection"
                        )}
                    </div>


                    <h3
                        class="customer-product-name"
                    >
                        ${escapeHtml(
                            product.name ||
                            "Product"
                        )}
                    </h3>


                    ${
                        product.description
                            ? `
                                <p
                                    class="customer-product-description"
                                >
                                    ${escapeHtml(
                                        product.description
                                    )}
                                </p>
                            `
                            : ""
                    }


                    <div
                        class="customer-product-bottom"
                    >

                        <strong
                            class="customer-product-price"
                        >
                            ${money(
                                product.price
                            )}
                        </strong>


                        ${
                            available
                                ? `
                                    <button
                                        type="button"
                                        class="customer-add-button"
                                        data-product-id="${productId}"
                                    >
                                        ${
                                            cartQuantity
                                                ? "Add More"
                                                : "Add to Cart"
                                        }
                                    </button>
                                `
                                : `
                                    <button
                                        type="button"
                                        class="customer-add-button"
                                        disabled
                                    >
                                        Out of Stock
                                    </button>
                                `
                        }

                    </div>


                    ${
                        cartQuantity
                            ? `
                                <div
                                    class="customer-in-cart"
                                >
                                    ${cartQuantity}
                                    ${
                                        cartQuantity ===
                                        1
                                            ? "item"
                                            : "items"
                                    }
                                    in cart
                                </div>
                            `
                            : ""
                    }

                </div>

            </article>
        `;
    }


    /* =========================================================
       PRODUCT RENDERING
       ========================================================= */

    function renderCustomerProducts() {

        const root =
            document.querySelector(
                "#customer-products"
            );


        if (!root) {
            return;
        }


        const products =
            getFilteredCustomerProducts();


        if (!products.length) {

            root.innerHTML = `

                <div
                    class="customer-empty-products"
                >

                    <div
                        class="customer-empty-icon"
                    >
                        ✦
                    </div>

                    <h3>
                        No products found
                    </h3>

                    <p>
                        There are no products in
                        ${escapeHtml(
                            customerSelectedCategory
                        )}
                        right now.
                    </p>

                    <button
                        type="button"
                        class="customer-secondary-button"
                        data-show-all-products="true"
                    >
                        View All Products
                    </button>

                </div>
            `;

        } else {

            root.innerHTML =
                products
                    .map(productCard)
                    .join("");
        }


        setupImageFallbacks(root);


        root.onclick =
            event => {

                const addButton =
                    event.target.closest(
                        ".customer-add-button[data-product-id]"
                    );


                if (addButton) {

                    addToCart(
                        Number(
                            addButton.dataset
                                .productId
                        )
                    );

                    return;
                }


                const allButton =
                    event.target.closest(
                        "[data-show-all-products]"
                    );


                if (allButton) {

                    selectCustomerCategory(
                        "All Products"
                    );
                }
            };
    }


    /* =========================================================
       ADD TO CART
       ========================================================= */

    function addToCart(productId) {

        const product =
            getCustomerProducts()
                .find(
                    item =>
                        Number(item.id) ===
                        Number(productId)
                );


        if (!product) {

            showToast(
                "Product could not be found.",
                "error"
            );

            return;
        }


        const stock =
            getProductStock(
                product
            );


        if (
            product.is_available === false ||
            stock <= 0
        ) {

            showToast(
                "This product is out of stock.",
                "error"
            );

            return;
        }


        const existing =
            findCartItem(
                productId
            );


        if (existing) {

            if (
                Number(existing.quantity) >=
                stock
            ) {

                showToast(
                    "You cannot add more than the available stock.",
                    "error"
                );

                return;
            }


            existing.quantity =
                Number(existing.quantity) +
                1;

        } else {

            customerCart.push({

                product_id:
                    Number(product.id),

                name:
                    product.name,

                price:
                    Number(
                        product.price || 0
                    ),

                quantity:
                    1,

                image:
                    getProductImage(
                        product
                    ),

                category:
                    getProductCategory(
                        product
                    )
            });
        }


        saveCustomerCart();

        renderCustomerProducts();
        renderCustomerCart();

        updateCartBadge();

        showToast(
            `${product.name} added to cart.`,
            "success"
        );
    }


    window.addToCustomerCart =
        addToCart;


    /* =========================================================
       CART QUANTITY
       ========================================================= */

    function changeCartQuantity(
        productId,
        amount
    ) {

        const item =
            findCartItem(
                productId
            );


        if (!item) {
            return;
        }


        const product =
            getCustomerProducts()
                .find(
                    p =>
                        Number(p.id) ===
                        Number(productId)
                );


        const stock =
            product
                ? getProductStock(
                    product
                )
                : Infinity;


        const newQuantity =
            Number(item.quantity) +
            Number(amount);


        if (newQuantity <= 0) {

            customerCart =
                customerCart.filter(
                    cartItem =>
                        Number(
                            cartItem.product_id
                        ) !==
                        Number(productId)
                );

        } else if (
            Number.isFinite(stock) &&
            newQuantity > stock
        ) {

            showToast(
                "You cannot exceed the available stock.",
                "error"
            );

            return;

        } else {

            item.quantity =
                newQuantity;
        }


        saveCustomerCart();

        renderCustomerCart();
        renderCustomerProducts();

        updateCartBadge();
    }


    function removeFromCart(
        productId
    ) {

        customerCart =
            customerCart.filter(
                item =>
                    Number(
                        item.product_id
                    ) !==
                    Number(productId)
            );


        saveCustomerCart();

        renderCustomerCart();
        renderCustomerProducts();

        updateCartBadge();
    }


    window.changeCustomerCartQuantity =
        changeCartQuantity;

    window.removeFromCustomerCart =
        removeFromCart;


    /* =========================================================
       CART RENDERING
       ========================================================= */

    function renderCustomerCart() {

        const root =
            document.querySelector(
                "#customer-cart"
            );


        if (!root) {
            return;
        }


        if (!customerCart.length) {

            root.innerHTML = `

                <div
                    class="customer-cart-empty"
                >

                    <div
                        class="customer-cart-empty-icon"
                    >
                        🛍️
                    </div>

                    <h3>
                        Your cart is empty
                    </h3>

                    <p>
                        Add products you love
                        and they will appear here.
                    </p>

                </div>
            `;

            return;
        }


        root.innerHTML = `

            <div
                class="customer-cart-header"
            >

                <div>

                    <span
                        class="customer-cart-label"
                    >
                        YOUR BAG
                    </span>

                    <h3>
                        Shopping Cart
                    </h3>

                </div>


                <span
                    class="customer-cart-count"
                >
                    ${cartCount()}
                </span>

            </div>


            <div
                class="customer-cart-items"
            >

                ${customerCart
                    .map(item => {

                        return `
                            <div
                                class="customer-cart-item"
                            >

                                <div
                                    class="customer-cart-thumb"
                                >

                                    ${
                                        item.image
                                            ? `
                                                <img
                                                    src="${escapeHtml(
                                                        item.image
                                                    )}"
                                                    alt="${escapeHtml(
                                                        item.name
                                                    )}"
                                                >
                                            `
                                            : `
                                                <span>
                                                    ✦
                                                </span>
                                            `
                                    }

                                </div>


                                <div
                                    class="customer-cart-item-info"
                                >

                                    <strong>
                                        ${escapeHtml(
                                            item.name
                                        )}
                                    </strong>

                                    <span>
                                        ${money(
                                            item.price
                                        )}
                                    </span>


                                    <div
                                        class="customer-cart-controls"
                                    >

                                        <button
                                            type="button"
                                            data-cart-action="decrease"
                                            data-product-id="${
                                                item.product_id
                                            }"
                                        >
                                            −
                                        </button>

                                        <span>
                                            ${item.quantity}
                                        </span>

                                        <button
                                            type="button"
                                            data-cart-action="increase"
                                            data-product-id="${
                                                item.product_id
                                            }"
                                        >
                                            +
                                        </button>

                                    </div>

                                </div>


                                <button
                                    type="button"
                                    class="customer-cart-remove"
                                    data-cart-action="remove"
                                    data-product-id="${
                                        item.product_id
                                    }"
                                    aria-label="Remove product"
                                >
                                    ×
                                </button>

                            </div>
                        `;

                    })
                    .join("")}

            </div>


            <div
                class="customer-cart-summary"
            >

                <div
                    class="customer-cart-summary-row"
                >
                    <span>
                        Items
                    </span>

                    <strong>
                        ${cartCount()}
                    </strong>
                </div>


                <div
                    class="customer-cart-summary-row customer-cart-total"
                >
                    <span>
                        Total
                    </span>

                    <strong>
                        ${money(
                            cartTotal()
                        )}
                    </strong>
                </div>


                <button
                    type="button"
                    class="customer-checkout-button"
                    id="customer-checkout-button"
                >
                    Proceed to Checkout
                </button>

            </div>
        `;


        root.onclick =
            event => {

                const button =
                    event.target.closest(
                        "[data-cart-action]"
                    );


                if (!button) {
                    return;
                }


                const productId =
                    Number(
                        button.dataset
                            .productId
                    );


                const action =
                    button.dataset
                        .cartAction;


                if (
                    action ===
                    "increase"
                ) {

                    changeCartQuantity(
                        productId,
                        1
                    );

                } else if (
                    action ===
                    "decrease"
                ) {

                    changeCartQuantity(
                        productId,
                        -1
                    );

                } else if (
                    action ===
                    "remove"
                ) {

                    removeFromCart(
                        productId
                    );
                }
            };


        const checkout =
            root.querySelector(
                "#customer-checkout-button"
            );


        if (checkout) {

            checkout.addEventListener(
                "click",
                openCheckout
            );
        }
    }


    function updateCartBadge() {

        const count =
            cartCount();


        document
            .querySelectorAll(
                ".customer-cart-badge"
            )
            .forEach(element => {

                element.textContent =
                    count;

                element.style.display =
                    count > 0
                        ? "inline-flex"
                        : "none";
            });
    }


    /* =========================================================
       CHECKOUT
       ========================================================= */

    function openCheckout() {

        if (!customerCart.length) {

            showToast(
                "Your cart is empty.",
                "error"
            );

            return;
        }


        const html = `

            <div
                class="customer-checkout-modal"
            >

                <div
                    class="customer-checkout-heading"
                >

                    <span>
                        CHECKOUT
                    </span>

                    <h2>
                        Complete your order
                    </h2>

                    <p>
                        Enter your delivery
                        information below.
                    </p>

                </div>


                <form
                    id="customer-checkout-form"
                    class="customer-checkout-form"
                >

                    <label>
                        Full Name

                        <input
                            id="checkout-name"
                            type="text"
                            required
                            placeholder="Your full name"
                        >
                    </label>


                    <label>
                        Phone Number

                        <input
                            id="checkout-phone"
                            type="tel"
                            required
                            placeholder="03XXXXXXXXX"
                        >
                    </label>


                    <label>
                        Delivery Address

                        <textarea
                            id="checkout-address"
                            rows="3"
                            required
                            placeholder="Complete delivery address"
                        ></textarea>
                    </label>


                    <label>
                        Additional Notes

                        <textarea
                            id="checkout-notes"
                            rows="2"
                            placeholder="Any additional instructions"
                        ></textarea>
                    </label>


                    <div
                        class="customer-checkout-summary"
                    >

                        <div>
                            <span>
                                Items
                            </span>

                            <strong>
                                ${cartCount()}
                            </strong>
                        </div>


                        <div>
                            <span>
                                Total
                            </span>

                            <strong>
                                ${money(
                                    cartTotal()
                                )}
                            </strong>
                        </div>

                    </div>


                    <div
                        class="customer-checkout-actions"
                    >

                        <button
                            type="button"
                            class="customer-secondary-button"
                            id="customer-cancel-checkout"
                        >
                            Cancel
                        </button>


                        <button
                            type="submit"
                            class="customer-checkout-button"
                            id="customer-place-order"
                        >
                            Place Order
                        </button>

                    </div>

                </form>

            </div>
        `;


        if (
            !openCustomerModal(html)
        ) {
            return;
        }


        const form =
            document.querySelector(
                "#customer-checkout-form"
            );


        const cancel =
            document.querySelector(
                "#customer-cancel-checkout"
            );


        if (cancel) {

            cancel.addEventListener(
                "click",
                closeCustomerModal
            );
        }


        if (form) {

            form.addEventListener(
                "submit",
                submitOrder
            );
        }
    }


    async function submitOrder(
        event
    ) {

        event.preventDefault();


        const form =
            event.currentTarget;


        const button =
            form.querySelector(
                "#customer-place-order"
            );


        const name =
            form.querySelector(
                "#checkout-name"
            )?.value.trim();


        const phone =
            form.querySelector(
                "#checkout-phone"
            )?.value.trim();


        const address =
            form.querySelector(
                "#checkout-address"
            )?.value.trim();


        const notes =
            form.querySelector(
                "#checkout-notes"
            )?.value.trim();


        if (
            !name ||
            !phone ||
            !address
        ) {

            showToast(
                "Please fill in your name, phone and address.",
                "error"
            );

            return;
        }


        if (button) {

            button.disabled =
                true;

            button.textContent =
                "Placing Order...";
        }


        const orderNotes = [

            `Customer Name: ${name}`,

            `Phone: ${phone}`,

            `Delivery Address: ${address}`,

            notes
                ? `Additional Notes: ${notes}`
                : ""

        ]
            .filter(Boolean)
            .join("\n");


        try {

            await api(
                "/api/orders",
                {
                    method: "POST",

                    body: {

                        items:
                            customerCart.map(
                                item => ({

                                    product_id:
                                        Number(
                                            item.product_id
                                        ),

                                    quantity:
                                        Number(
                                            item.quantity
                                        )
                                })
                            ),

                        notes:
                            orderNotes
                    }
                }
            );


            customerCart = [];

            saveCustomerCart();

            closeCustomerModal();

            updateCartBadge();

            renderCustomerCart();

            renderCustomerProducts();


            showToast(
                "Your order has been placed successfully!",
                "success"
            );


            setTimeout(
                () => {

                    if (
                        typeof window.route ===
                        "function"
                    ) {

                        window.route(
                            "orders"
                        );
                    }

                },
                700
            );


        } catch (error) {

            showToast(
                error?.message ||
                    "Could not place your order.",
                "error"
            );

        } finally {

            if (button) {

                button.disabled =
                    false;

                button.textContent =
                    "Place Order";
            }
        }
    }


    window.openCustomerCheckout =
        openCheckout;


    /* =========================================================
       LOAD PRODUCTS
       ========================================================= */

    async function loadProducts() {

        try {

            const data =
                await api(
                    "/api/products"
                );


            let products = [];


            if (
                data &&
                Array.isArray(
                    data.products
                )
            ) {

                products =
                    data.products;

            } else if (
                Array.isArray(data)
            ) {

                products =
                    data;
            }


            try {

                productsCache =
                    products;

            } catch {}


        } catch (error) {

            console.error(
                "AURA products loading error:",
                error
            );


            showToast(
                error?.message ||
                    "Could not load products.",
                "error"
            );
        }
    }


    /* =========================================================
       UPDATE PRODUCT HEADING
       ========================================================= */

    function updateProductsHeading() {

        const title =
            document.querySelector(
                "#customer-products-title"
            );


        const count =
            document.querySelector(
                "#customer-products-count"
            );


        if (title) {

            title.textContent =
                customerSelectedCategory;
        }


        if (count) {

            const total =
                getFilteredCustomerProducts()
                    .length;


            count.textContent =
                `${total} ${
                    total === 1
                        ? "product"
                        : "products"
                }`;
        }
    }


    /* =========================================================
       CUSTOMER STORE
       ========================================================= */

    async function customerStorePage() {

        customerSelectedCategory =
            "All Products";


        loadCustomerCart();


        await loadProducts();


        renderCustomerStore();
    }


    function renderCustomerStoreInto(
        mount
    ) {

        if (!mount) {
            return;
        }


        let businessName =
            "AURA Store";


        try {

            if (
                typeof biz !==
                    "undefined" &&
                biz?.name
            ) {

                businessName =
                    biz.name;
            }

        } catch {}


        mount.innerHTML = `

            <div
                class="customer-store-page"
            >

                <section
                    class="customer-store-hero"
                >

                    <div
                        class="customer-store-hero-copy"
                    >

                        <span
                            class="customer-eyebrow"
                        >
                            AURA SHOP
                        </span>


                        <h1>
                            Discover something
                            <br>
                            <em>
                                beautiful.
                            </em>
                        </h1>


                        <p>
                            Explore products from
                            ${escapeHtml(
                                businessName
                            )}
                            and discover
                            something perfect
                            for your everyday life.
                        </p>

                    </div>


                    <div
                        class="customer-store-hero-mark"
                    >

                        <span>
                            01
                        </span>

                        <span>
                            02
                        </span>

                        <span>
                            03
                        </span>

                        <span>
                            04
                        </span>

                    </div>

                </section>


                <section
                    class="customer-store-content"
                >

                    <div
                        class="customer-store-main"
                    >

                        <div
                            class="customer-section-heading"
                        >

                            <div>

                                <span>
                                    SHOP BY CATEGORY
                                </span>

                                <h2>
                                    What are you looking for?
                                </h2>

                            </div>

                        </div>


                        <div
                            id="customer-categories"
                            class="customer-categories"
                        ></div>


                        <div
                            class="customer-products-heading"
                        >

                            <div>

                                <span>
                                    COLLECTION
                                </span>

                                <h2
                                    id="customer-products-title"
                                >
                                    All Products
                                </h2>

                            </div>


                            <span
                                id="customer-products-count"
                                class="customer-products-count"
                            ></span>

                        </div>


                        <div
                            id="customer-products"
                            class="customer-product-grid"
                        ></div>

                    </div>


                    <aside
                        id="customer-cart"
                        class="customer-cart"
                    ></aside>

                </section>

            </div>
        `;


        renderCustomerCategories();

        renderCustomerProducts();

        renderCustomerCart();

        updateCartBadge();

        updateProductsHeading();
    }


    function renderCustomerStore() {

        const mount =
            document.querySelector(
                "#customer-store-mount"
            );


        if (!mount) {
            return;
        }


        renderCustomerStoreInto(
            mount
        );
    }


    /* =========================================================
       CUSTOMER SHELL
       ========================================================= */

    function customerRenderShell() {

        /*
         * VERY IMPORTANT:
         * AURA's actual page container is #page.
         * Do NOT change this to #app.
         */

        const page =
            document.querySelector(
                "#page"
            );


        if (!page) {

            console.error(
                "AURA ERROR: #page was not found."
            );

            return;
        }


        /*
         * Hide old owner dashboard elements
         * only while customer shell is active.
         */

        const oldSidebar =
            document.querySelector(
                ".sidebar"
            );


        const oldTopbar =
            document.querySelector(
                ".topbar"
            );


        if (oldSidebar) {

            oldSidebar.style.setProperty(
                "display",
                "none",
                "important"
            );
        }


        if (oldTopbar) {

            oldTopbar.style.setProperty(
                "display",
                "none",
                "important"
            );
        }


        page.innerHTML = `

            <div
                class="customer-app-shell"
            >

                <header
                    class="customer-topbar"
                >

                    <div
                        class="customer-brand"
                    >

                        <button
                            type="button"
                            class="customer-brand-button"
                            id="customer-brand-home"
                        >

                            <span
                                class="customer-brand-symbol"
                            >
                                A
                            </span>

                            <span>
                                AURA
                            </span>

                        </button>

                    </div>


                    <nav
                        class="customer-main-nav"
                    >

                        <button
                            type="button"
                            data-customer-nav="store"
                        >
                            Shop
                        </button>


                        <button
                            type="button"
                            data-customer-nav="orders"
                        >
                            My Orders
                        </button>


                        <button
                            type="button"
                            data-customer-nav="profile"
                        >
                            Profile
                        </button>

                    </nav>


                    <div
                        class="customer-top-actions"
                    >

                        <button
                            type="button"
                            class="customer-cart-top-button"
                            id="customer-cart-top-button"
                        >

                            🛍️

                            <span
                                class="customer-cart-badge"
                                style="display:none;"
                            >
                                0
                            </span>

                        </button>

                    </div>

                </header>


                <main
                    id="customer-main-content"
                    class="customer-main-content"
                ></main>

            </div>
        `;


        const main =
            document.querySelector(
                "#customer-main-content"
            );


        if (!main) {
            return;
        }


        function renderPage(pageName) {

            if (!main) {
                return;
            }


            if (
                pageName ===
                "store"
            ) {

                main.innerHTML = `

                    <div
                        id="customer-store-mount"
                    ></div>

                `;


                customerStorePage()
                    .then(
                        () => {

                            renderCustomerStore();
                        }
                    )
                    .catch(
                        error => {

                            console.error(
                                error
                            );
                        }
                    );

                return;
            }


            if (
                pageName ===
                "orders"
            ) {

                main.innerHTML = `

                    <div
                        id="customer-orders-mount"
                    ></div>

                `;


                const mount =
                    main.querySelector(
                        "#customer-orders-mount"
                    );


                /*
                 * Use the existing AURA
                 * orders page if available.
                 */

                if (
                    typeof window.ordersPage ===
                    "function"
                ) {

                    window.ordersPage(
                        mount
                    );

                } else {

                    main.innerHTML = `

                        <div
                            class="customer-page-placeholder"
                        >

                            <h2>
                                My Orders
                            </h2>

                            <p>
                                Your orders
                                will appear here.
                            </p>

                        </div>
                    `;
                }

                return;
            }


            if (
                pageName ===
                "profile"
            ) {

                main.innerHTML = `

                    <div
                        id="customer-profile-mount"
                    ></div>

                `;


                const mount =
                    main.querySelector(
                        "#customer-profile-mount"
                    );


                if (
                    typeof window.profilePage ===
                    "function"
                ) {

                    window.profilePage(
                        mount
                    );

                } else {

                    main.innerHTML = `

                        <div
                            class="customer-page-placeholder"
                        >

                            <h2>
                                Profile
                            </h2>

                            <p>
                                Your profile
                                information.
                            </p>

                        </div>
                    `;
                }

                return;
            }


            renderPage("store");
        }


        document
            .querySelectorAll(
                "[data-customer-nav]"
            )
            .forEach(button => {

                button.addEventListener(
                    "click",
                    () => {

                        renderPage(
                            button.dataset
                                .customerNav
                        );
                    }
                );
            });


        const brand =
            document.querySelector(
                "#customer-brand-home"
            );


        if (brand) {

            brand.addEventListener(
                "click",
                () => {

                    renderPage(
                        "store"
                    );
                }
            );
        }


        const cartButton =
            document.querySelector(
                "#customer-cart-top-button"
            );


        if (cartButton) {

            cartButton.addEventListener(
                "click",
                () => {

                    const cart =
                        document.querySelector(
                            "#customer-cart"
                        );


                    if (cart) {

                        cart.scrollIntoView({
                            behavior:
                                "smooth",

                            block:
                                "start"
                        });
                    }
                }
            );
        }


        /*
         * First page for customer:
         * STORE
         */

        renderPage("store");
    }


    window.customerRenderShell =
        customerRenderShell;


    /* =========================================================
       ROUTE OVERRIDE
       ========================================================= */

    window.route =
        function(pageName) {

            let isCustomer =
                false;


            try {

                isCustomer =
                    typeof me !==
                        "undefined" &&
                    me?.role ===
                        "customer";

            } catch {}


            /*
             * Owner/staff:
             * use original AURA route.
             */

            if (!isCustomer) {

                if (
                    auraOriginalRoute
                ) {

                    return auraOriginalRoute(
                        pageName
                    );
                }

                return;
            }


            /*
             * Customer:
             * only customer pages.
             */

            const allowedPages = [
                "store",
                "orders",
                "profile"
            ];


            if (
                !allowedPages.includes(
                    pageName
                )
            ) {

                pageName =
                    "store";
            }


            loadCustomerCart();


            customerRenderShell();


            /*
             * customerRenderShell()
             * already opens Store.
             */

            if (
                pageName ===
                "store"
            ) {

                return;
            }


            const navButton =
                document.querySelector(
                    `[data-customer-nav="${pageName}"]`
                );


            if (navButton) {

                navButton.click();
            }
        };


    /* =========================================================
       CUSTOMER SIGNUP
       ========================================================= */

    window.setAuthMode =
        function(signup = false) {

            /*
             * Normal Sign In:
             * keep original AURA screen.
             */

            if (!signup) {

                if (
                    auraOriginalSetAuthMode
                ) {

                    return auraOriginalSetAuthMode(
                        false
                    );
                }

                return;
            }


            const root =
                document.querySelector(
                    "#auth-root"
                );


            if (!root) {
                return;
            }


            root.innerHTML = `

                <div
                    class="auth-card customer-signup-card"
                >

                    <div
                        class="auth-brand"
                    >
                        <span>
                            AURA
                        </span>
                    </div>


                    <div
                        class="auth-heading"
                    >

                        <span>
                            CREATE ACCOUNT
                        </span>

                        <h1>
                            Join AURA
                        </h1>

                        <p>
                            Create your customer
                            account and start
                            shopping.
                        </p>

                    </div>


                    <form
                        id="customer-signup-form"
                        class="auth-form"
                    >

                        <label>

                            Full Name

                            <input
                                id="customer-signup-name"
                                type="text"
                                required
                                placeholder="Your name"
                            >

                        </label>


                        <label>

                            Email

                            <input
                                id="customer-signup-email"
                                type="email"
                                required
                                placeholder="you@example.com"
                            >

                        </label>


                        <label>

                            Password

                            <input
                                id="customer-signup-password"
                                type="password"
                                required
                                minlength="8"
                                placeholder="At least 8 characters"
                            >

                        </label>


                        <label>

                            Store

                            <select
                                id="customer-signup-business"
                                required
                            >

                                <option value="">
                                    Loading stores...
                                </option>

                            </select>

                        </label>


                        <button
                            type="submit"
                            class="auth-submit"
                        >
                            Create Account
                        </button>

                    </form>


                    <button
                        type="button"
                        id="customer-back-signin"
                        class="auth-switch"
                    >

                        Already have an account?

                        <strong>
                            Sign in
                        </strong>

                    </button>

                </div>
            `;


            const back =
                document.querySelector(
                    "#customer-back-signin"
                );


            if (back) {

                back.addEventListener(
                    "click",
                    () => {

                        if (
                            auraOriginalSetAuthMode
                        ) {

                            auraOriginalSetAuthMode(
                                false
                            );
                        }
                    }
                );
            }


            const form =
                document.querySelector(
                    "#customer-signup-form"
                );


            if (form) {

                form.addEventListener(
                    "submit",
                    submitCustomerSignup
                );
            }


            loadCustomerBusinesses();
        };


    /* =========================================================
       CUSTOMER STORE / BUSINESS LIST
       ========================================================= */

    async function loadCustomerBusinesses() {

        const select =
            document.querySelector(
                "#customer-signup-business"
            );


        if (!select) {
            return;
        }


        try {

            const data =
                await api(
                    "/api/auth/businesses"
                );


            const businesses =
                Array.isArray(data)
                    ? data
                    : (
                        data?.businesses ||
                        []
                    );


            if (!businesses.length) {

                select.innerHTML = `

                    <option value="">
                        No stores available
                    </option>

                `;

                return;
            }


            select.innerHTML = `

                <option value="">
                    Select a store
                </option>

                ${businesses
                    .map(
                        business => `

                            <option
                                value="${Number(
                                    business.id
                                )}"
                            >
                                ${escapeHtml(
                                    business.name
                                )}
                            </option>

                        `
                    )
                    .join("")}

            `;

        } catch (error) {

            console.error(
                "Could not load businesses:",
                error
            );


            select.innerHTML = `

                <option value="">
                    Could not load stores
                </option>

            `;
        }
    }


    /* =========================================================
       CUSTOMER SIGNUP SUBMIT
       ========================================================= */

    async function submitCustomerSignup(
        event
    ) {

        event.preventDefault();


        const name =
            document.querySelector(
                "#customer-signup-name"
            )?.value.trim();


        const email =
            document.querySelector(
                "#customer-signup-email"
            )?.value.trim();


        const password =
            document.querySelector(
                "#customer-signup-password"
            )?.value;


        const businessId =
            document.querySelector(
                "#customer-signup-business"
            )?.value;


        if (
            !name ||
            !email ||
            !password ||
            !businessId
        ) {

            showToast(
                "Please complete all fields.",
                "error"
            );

            return;
        }


        try {

            await api(
                "/api/auth/signup",
                {
                    method: "POST",

                    body: {

                        name:
                            name,

                        email:
                            email,

                        password:
                            password,

                        business_id:
                            Number(
                                businessId
                            )
                    }
                }
            );


            showToast(
                "Account created successfully. Please sign in.",
                "success"
            );


            if (
                auraOriginalSetAuthMode
            ) {

                auraOriginalSetAuthMode(
                    false
                );
            }


            const signInEmail =
                document.querySelector(
                    "#signin-email"
                );


            if (signInEmail) {

                signInEmail.value =
                    email;
            }


        } catch (error) {

            showToast(
                error?.message ||
                    "Could not create account.",
                "error"
            );
        }
    }


    /* =========================================================
       INITIALIZATION
       ========================================================= */

    async function initializeCustomer() {

        loadCustomerCart();


        let isCustomer =
            false;


        try {

            isCustomer =
                typeof me !==
                    "undefined" &&
                me?.role ===
                    "customer";

        } catch {}


        /*
         * If not a customer, do nothing.
         * This keeps owner dashboard working.
         */

        if (!isCustomer) {
            return;
        }


        /*
         * Customer is already logged in.
         * Open customer store.
         */

        try {

            window.route(
                "store"
            );

        } catch (error) {

            console.error(
                "AURA customer initialization error:",
                error
            );
        }
    }


    /* =========================================================
       GLOBAL FUNCTIONS
       ========================================================= */

    window.customerStorePage =
        customerStorePage;

    window.renderCustomerCategories =
        renderCustomerCategories;

    window.renderCustomerProducts =
        renderCustomerProducts;

    window.renderCustomerCart =
        renderCustomerCart;

    window.updateCustomerCartBadge =
        updateCartBadge;


    /* =========================================================
       START
       ========================================================= */

    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            initializeCustomer,
            {
                once: true
            }
        );

    } else {

        initializeCustomer();
    }

})();