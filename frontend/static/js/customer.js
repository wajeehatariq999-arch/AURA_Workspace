/* =========================================================
   AURA CUSTOMER STOREFRONT
   Category filter + products + images + cart + checkout
========================================================= */

const auraOriginalSetAuthMode = window.setAuthMode;
const auraOriginalRenderShell = window.renderShell;
const auraOriginalRoute = window.route;

let customerCart = [];
let customerSelectedCategory = "All Products";

/* =========================================================
   CUSTOMER CATEGORIES
========================================================= */

const CUSTOMER_CATEGORIES = [
    {
        name: "Fashion & Clothing",
        icon: "✦",
        image: "/static/images/home/fashion.jpg",
    },
    {
        name: "Shoes & Footwear",
        icon: "◇",
        image: "/static/images/home/shoes.jpg",
    },
    {
        name: "Jewellery & Accessories",
        icon: "♢",
        image: "/static/images/home/jewellery.jpg",
    },
    {
        name: "Home & Living",
        icon: "⌂",
        image: "/static/images/home/home-living.jpg",
    },
    {
        name: "Bags",
        icon: "◇",
        image: "/static/images/home/bags.jpg",
    },
    {
        name: "Beauty & Personal Care",
        icon: "✦",
        image: "/static/images/home/beauty.jpg",
    },
    {
        name: "Electronics & Gadgets",
        icon: "◈",
        image: "/static/images/home/electronics.jpg",
    },
    {
        name: "Gifts & Lifestyle",
        icon: "✧",
        image: "/static/images/home/home-living.jpg",
    },
];

/* =========================================================
   HELPERS
========================================================= */

function customerNormalize(value) {
    return String(value || "")
        .trim()
        .toLowerCase()
        .replace(/&/g, "and")
        .replace(/\s+/g, " ");
}

function customerCategoryMatches(productCategory, selectedCategory) {
    if (selectedCategory === "All Products") {
        return true;
    }

    const product = customerNormalize(productCategory);
    const selected = customerNormalize(selectedCategory);

    if (product === selected) {
        return true;
    }

    const aliases = {
        "jewellery and accessories": [
            "accessories",
            "jewelry",
            "jewellery",
            "jewelry and accessories",
            "jewellery and accessories",
        ],

        "shoes and footwear": [
            "shoes",
            "footwear",
            "shoe",
            "shoes and footwear",
        ],

        "beauty and personal care": [
            "beauty",
            "personal care",
            "beauty and personal care",
        ],

        "electronics and gadgets": [
            "electronics",
            "gadgets",
            "electronics and gadgets",
        ],

        "home and living": [
            "home",
            "living",
            "home and living",
        ],

        "fashion and clothing": [
            "fashion",
            "clothing",
            "fashion and clothing",
        ],

        "gifts and lifestyle": [
            "gifts",
            "lifestyle",
            "gifts and lifestyle",
        ],
    };

    const possible = aliases[selected] || [];

    return possible.includes(product);
}

function customerCategoryFallbackImage(category) {
    const found = CUSTOMER_CATEGORIES.find(
        c => customerNormalize(c.name) === customerNormalize(category)
    );

    if (found) {
        return found.image;
    }

    const normalized = customerNormalize(category);

    if (
        normalized.includes("shoe") ||
        normalized.includes("footwear")
    ) {
        return "/static/images/home/shoes.jpg";
    }

    if (
        normalized.includes("fashion") ||
        normalized.includes("clothing")
    ) {
        return "/static/images/home/fashion.jpg";
    }

    if (
        normalized.includes("jewel") ||
        normalized.includes("accessor")
    ) {
        return "/static/images/home/jewellery.jpg";
    }

    if (
        normalized.includes("beauty") ||
        normalized.includes("personal care")
    ) {
        return "/static/images/home/beauty.jpg";
    }

    if (normalized.includes("bag")) {
        return "/static/images/home/bags.jpg";
    }

    if (
        normalized.includes("electronic") ||
        normalized.includes("gadget")
    ) {
        return "/static/images/home/electronics.jpg";
    }

    return "/static/images/home/home-living.jpg";
}

/* =========================================================
   CUSTOMER CART
========================================================= */

function customerCartKey() {
    return `aura_cart_${me?.id || "guest"}_${biz?.id || "store"}`;
}

function loadCustomerCart() {
    try {
        customerCart = JSON.parse(
            localStorage.getItem(customerCartKey()) || "[]"
        );

        if (!Array.isArray(customerCart)) {
            customerCart = [];
        }
    } catch {
        customerCart = [];
    }
}

function saveCustomerCart() {
    localStorage.setItem(
        customerCartKey(),
        JSON.stringify(customerCart)
    );
}

/* =========================================================
   CUSTOMER SIGNUP
========================================================= */

async function loadCustomerBusinesses() {
    const select = document.querySelector("#su-business-id");

    if (!select) {
        return;
    }

    try {
        const businesses = await api("/api/auth/businesses");

        select.innerHTML =
            '<option value="">Choose a store</option>' +
            businesses
                .map(
                    b => `
                        <option value="${b.id}">
                            ${esc(b.name)} · ${esc(b.currency)}
                        </option>
                    `
                )
                .join("");
    } catch {
        select.innerHTML =
            '<option value="">Could not load stores</option>';
    }
}

function setAccountType(type) {
    const owner = type === "owner";

    document
        .querySelector("#account-owner")
        ?.classList.toggle("active", owner);

    document
        .querySelector("#account-customer")
        ?.classList.toggle("active", !owner);

    document
        .querySelector("#owner-fields")
        ?.classList.toggle("hidden", !owner);

    document
        .querySelector("#customer-fields")
        ?.classList.toggle("hidden", owner);

    const form = document.querySelector("#signup-form");

    if (form) {
        form.dataset.accountType = type;
    }

    if (!owner) {
        loadCustomerBusinesses();
    }
}

/* =========================================================
   SIGNUP SCREEN
========================================================= */

window.setAuthMode = function (signup = false) {
    if (!signup) {
        auraOriginalSetAuthMode(false);
        return;
    }

    document
        .querySelector("#signin-tab")
        ?.classList.remove("active");

    document
        .querySelector("#signup-tab")
        ?.classList.add("active");

    document.querySelector("#auth-panel").innerHTML = `
        <form
            id="signup-form"
            class="auth-form"
            data-account-type="customer"
        >

            <div class="eyebrow">
                JOIN AURA
            </div>

            <h1>Create your customer account</h1>

            <p>
                Create your account, choose a store,
                browse products and place orders.
            </p>

            <div class="form-grid">

                <div class="field full">
                    <label>Full name</label>
                    <input
                        id="su-name"
                        required
                        minlength="2"
                        autocomplete="name"
                    >
                </div>

                <div class="field full">
                    <label>Email</label>
                    <input
                        id="su-email"
                        type="email"
                        required
                        autocomplete="email"
                    >
                </div>

                <div class="field full">
                    <label>Password</label>
                    <input
                        id="su-password"
                        type="password"
                        minlength="8"
                        required
                        autocomplete="new-password"
                    >
                </div>

                <div class="field full">
                    <label>Choose store</label>

                    <select id="su-business-id" required>
                        <option value="">
                            Loading stores…
                        </option>
                    </select>
                </div>

            </div>

            <div class="top-note" style="margin-top:10px">
                Your customer account will be connected
                to the selected store.
            </div>

            <p
                id="auth-error"
                class="error"
            ></p>

            <button
                class="btn btn-primary btn-full"
            >
                Create customer account
            </button>

        </form>
    `;

    document
        .querySelector("#signup-form")
        .onsubmit = async e => {
            e.preventDefault();
            await authSubmit(true);
        };

    loadCustomerBusinesses();
};

/* =========================================================
   LOGIN / SIGNUP
========================================================= */

window.authSubmit = async function (signup) {
    const error = document.querySelector("#auth-error");

    if (error) {
        error.textContent = "";
    }

    try {
        if (!signup) {
            me = await api(
                "/api/auth/signin",
                {
                    method: "POST",
                    body: {
                        email:
                            document.querySelector("#si-email").value,
                        password:
                            document.querySelector("#si-password").value,
                    },
                }
            );
        } else {
            const form =
                document.querySelector("#signup-form");

            const type =
                form?.dataset.accountType || "owner";

            if (type === "customer") {
                const businessId = Number(
                    document.querySelector("#su-business-id").value
                );

                if (!businessId) {
                    throw new Error("Please choose a store.");
                }

                me = await api(
                    "/api/auth/customer-signup",
                    {
                        method: "POST",
                        body: {
                            full_name:
                                document.querySelector("#su-name").value,
                            email:
                                document.querySelector("#su-email").value,
                            password:
                                document.querySelector("#su-password").value,
                            business_id: businessId,
                        },
                    }
                );
            } else {
                const businessName =
                    document
                        .querySelector("#su-business")
                        .value
                        .trim();

                if (!businessName) {
                    throw new Error(
                        "Please enter your business name."
                    );
                }

                me = await api(
                    "/api/auth/signup",
                    {
                        method: "POST",
                        body: {
                            full_name:
                                document.querySelector("#su-name").value,
                            email:
                                document.querySelector("#su-email").value,
                            password:
                                document.querySelector("#su-password").value,
                            business_name: businessName,
                        },
                    }
                );
            }
        }

        await enter();
    } catch (e) {
        if (error) {
            error.textContent = e.message;
        }
    }
};

/* =========================================================
   CATEGORY BUTTON
========================================================= */

function customerCategoryButton(category) {
    const active =
        customerSelectedCategory === category.name;

    return `
        <button
            type="button"
            class="customer-category ${active ? "active" : ""}"
            data-category="${esc(category.name)}"
        >
            <span class="customer-category-icon">
                ${category.icon}
            </span>

            <span class="customer-category-name">
                ${esc(category.name)}
            </span>
        </button>
    `;
}

function selectCustomerCategory(categoryName) {
    customerSelectedCategory = categoryName;

    renderCustomerCategories();
    renderCustomerProducts();
}

function renderCustomerCategories() {
    const root =
        document.querySelector("#customer-categories");

    if (!root) {
        return;
    }

    root.innerHTML = `
        <button
            type="button"
            class="customer-category ${
                customerSelectedCategory === "All Products"
                    ? "active"
                    : ""
            }"
            data-category="All Products"
        >
            <span class="customer-category-icon">
                ✦
            </span>

            <span class="customer-category-name">
                All Products
            </span>
        </button>

        ${CUSTOMER_CATEGORIES
            .map(customerCategoryButton)
            .join("")}
    `;

    root.onclick = event => {
        const button = event.target.closest(
            ".customer-category"
        );

        if (!button || !root.contains(button)) {
            return;
        }

        const category = button.dataset.category;

        if (category) {
            selectCustomerCategory(category);
        }
    };
}

/* =========================================================
   PRODUCT IMAGE
========================================================= */

function customerProductImage(p) {
    const img =
        p.images?.find(x => x.is_primary) ||
        p.images?.[0];

    const fallback =
        customerCategoryFallbackImage(p.category);

    if (!img) {
        return `
            <div class="customer-product-image">
                <img
                    src="${fallback}"
                    alt="${esc(p.name)}"
                    loading="lazy"
                    onerror="this.style.display='none';"
                >

                <div class="customer-image-fallback">
                    <span>AURA</span>
                </div>
            </div>
        `;
    }

    return `
        <div class="customer-product-image">
            <img
                src="${esc(img.url)}"
                alt="${esc(p.name)}"
                loading="lazy"
                onerror="
                    this.onerror=null;
                    this.src='${fallback}';
                "
            >

            <div class="customer-image-fallback">
                <span>${esc(p.category || "AURA")}</span>
            </div>
        </div>
    `;
}

/* =========================================================
   PRODUCT CARD
========================================================= */

function customerProductCard(p) {
    const unavailable =
        !p.is_available ||
        Number(p.stock) <= 0;

    return `
        <article class="customer-product">
            ${customerProductImage(p)}

            <div class="customer-product-body">

                <div class="customer-product-category">
                    ${esc(p.category || "Product")}
                </div>

                <h3>
                    ${esc(p.name)}
                </h3>

                <p>
                    ${esc(
                        p.description ||
                        "A beautiful product from the AURA collection."
                    )}
                </p>

                <div class="customer-product-footer">
                    <strong class="customer-price">
                        ${money(p.price)}
                    </strong>

                    <span class="customer-stock">
                        ${
                            unavailable
                                ? "Unavailable"
                                : `${p.stock} in stock`
                        }
                    </span>
                </div>

                <button
                    class="btn btn-primary btn-full customer-add-button"
                    ${
                        unavailable
                            ? "disabled"
                            : ""
                    }
                    onclick="addToCustomerCart(${p.id})"
                >
                    ${
                        unavailable
                            ? "Unavailable"
                            : "Add to cart"
                    }
                </button>

            </div>
        </article>
    `;
}

/* =========================================================
   FILTERED PRODUCTS
========================================================= */

function getFilteredCustomerProducts() {
    return productsCache.filter(product =>
        customerCategoryMatches(
            product.category,
            customerSelectedCategory
        )
    );
}

function renderCustomerProducts() {
    const grid =
        document.querySelector(
            "#customer-product-grid"
        );

    const title =
        document.querySelector(
            "#customer-collection-title"
        );

    const count =
        document.querySelector(
            "#customer-product-count"
        );

    if (!grid) {
        return;
    }

    const products =
        getFilteredCustomerProducts();

    if (title) {
        title.textContent =
            customerSelectedCategory;
    }

    if (count) {
        count.textContent =
            `${products.length} ${
                products.length === 1
                    ? "product"
                    : "products"
            }`;
    }

    if (!products.length) {
        grid.innerHTML = `
            <div class="customer-no-products">
                <div class="customer-no-products-icon">
                    ◇
                </div>

                <h3>
                    No products in this category yet
                </h3>

                <p>
                    Try another category or browse
                    all products.
                </p>

                <button
                    class="btn btn-primary"
                    onclick="selectCustomerCategory('All Products')"
                >
                    View all products
                </button>
            </div>
        `;

        return;
    }

    grid.innerHTML =
        products
            .map(customerProductCard)
            .join("");
}

/* =========================================================
   CUSTOMER STORE
========================================================= */

async function customerStorePage() {
    try {
        const [
            products,
            business,
        ] = await Promise.all([
            api("/api/products"),
            api("/api/business"),
        ]);

        productsCache = Array.isArray(products)
            ? products
            : [];

        biz = business;
        currency = biz.currency || "PKR";

        customerSelectedCategory =
            "All Products";

        loadCustomerCart();

        document.querySelector("#page").innerHTML = `
            <div class="customer-store-page">

                <div class="customer-store-hero">

                    <div>
                        <div class="eyebrow">
                            AURA COLLECTION
                        </div>

                        <h1>
                            Discover something
                            <em>beautiful.</em>
                        </h1>

                        <p>
                            Explore ${esc(
                                biz.name
                            )}'s collection and find
                            products made for your everyday life.
                        </p>
                    </div>

                    <button
                        class="customer-cart-top"
                        onclick="openCustomerCart()"
                    >
                        <span>🛒</span>
                        <span>
                            Cart
                            <b id="customer-cart-count">
                                0
                            </b>
                        </span>
                    </button>

                </div>

                <section class="customer-category-section">

                    <div class="customer-section-label">
                        SHOP BY CATEGORY
                    </div>

                    <div
                        id="customer-categories"
                        class="customer-category-grid"
                    ></div>

                </section>

                <div class="customer-shop-layout">

                    <main>

                        <div class="customer-collection-head">
                            <div>
                                <div class="customer-section-label">
                                    COLLECTION
                                </div>

                                <h2
                                    id="customer-collection-title"
                                >
                                    All Products
                                </h2>
                            </div>

                            <span
                                id="customer-product-count"
                                class="customer-product-count"
                            >
                                0 products
                            </span>
                        </div>

                        <div
                            id="customer-product-grid"
                            class="customer-product-grid"
                        ></div>

                    </main>

                    <aside
                        class="customer-cart-panel"
                    >
                        <div class="customer-cart-heading">
                            <h2>Your cart</h2>

                            <span
                                id="customer-cart-total-items"
                            >
                                0 items
                            </span>
                        </div>

                        <div
                            id="customer-cart-content"
                        ></div>
                    </aside>

                </div>

            </div>
        `;

        renderCustomerCategories();
        renderCustomerProducts();
        renderCustomerCart();

    } catch (e) {
        document.querySelector("#page").innerHTML = `
            <div class="empty">
                <h2>Store could not be loaded</h2>
                <p>${esc(e.message)}</p>

                <button
                    class="btn btn-primary"
                    onclick="customerStorePage()"
                >
                    Try again
                </button>
            </div>
        `;
    }
}

/* =========================================================
   ADD TO CART
========================================================= */

function addToCustomerCart(productId) {
    const product =
        productsCache.find(
            p => p.id === productId
        );

    if (
        !product ||
        !product.is_available ||
        Number(product.stock) <= 0
    ) {
        return;
    }

    const existing =
        customerCart.find(
            x => x.product_id === productId
        );

    if (existing) {
        if (
            existing.quantity >=
            Number(product.stock)
        ) {
            toast(
                "You cannot add more than available stock.",
                "error"
            );

            return;
        }

        existing.quantity += 1;
    } else {
        customerCart.push({
            product_id: productId,
            quantity: 1,
        });
    }

    saveCustomerCart();
    renderCustomerCart();

    toast(
        `${product.name} added to cart`
    );
}

/* =========================================================
   CHANGE CART QUANTITY
========================================================= */

function changeCustomerCart(
    productId,
    delta
) {
    const row =
        customerCart.find(
            x => x.product_id === productId
        );

    const product =
        productsCache.find(
            p => p.id === productId
        );

    if (!row || !product) {
        return;
    }

    row.quantity += delta;

    if (row.quantity <= 0) {
        customerCart =
            customerCart.filter(
                x =>
                    x.product_id !==
                    productId
            );
    } else if (
        row.quantity >
        Number(product.stock)
    ) {
        row.quantity =
            Number(product.stock);

        toast(
            "Quantity limited to available stock.",
            "error"
        );
    }

    saveCustomerCart();
    renderCustomerCart();
}

/* =========================================================
   REMOVE FROM CART
========================================================= */

function removeFromCustomerCart(
    productId
) {
    customerCart =
        customerCart.filter(
            x =>
                x.product_id !==
                productId
        );

    saveCustomerCart();
    renderCustomerCart();
}

/* =========================================================
   RENDER CART
========================================================= */

function renderCustomerCart() {
    const content =
        document.querySelector(
            "#customer-cart-content"
        );

    if (!content) {
        return;
    }

    const count =
        customerCart.reduce(
            (sum, item) =>
                sum +
                Number(item.quantity || 0),
            0
        );

    const countEl =
        document.querySelector(
            "#customer-cart-count"
        );

    const totalItemsEl =
        document.querySelector(
            "#customer-cart-total-items"
        );

    if (countEl) {
        countEl.textContent = count;
    }

    if (totalItemsEl) {
        totalItemsEl.textContent =
            `${count} ${
                count === 1
                    ? "item"
                    : "items"
            }`;
    }

    if (!customerCart.length) {
        content.innerHTML = `
            <div class="customer-empty-cart">
                <div class="customer-empty-icon">
                    🛍
                </div>

                <strong>
                    Your cart is empty
                </strong>

                <span>
                    Add something beautiful
                    to your cart.
                </span>
            </div>
        `;

        return;
    }

    let total = 0;

    const rows =
        customerCart
            .map(item => {
                const product =
                    productsCache.find(
                        p =>
                            p.id ===
                            item.product_id
                    );

                if (!product) {
                    return "";
                }

                const line =
                    Number(product.price) *
                    Number(item.quantity);

                total += line;

                return `
                    <div
                        class="customer-cart-row"
                    >
                        <div class="customer-cart-product">
                            <b>
                                ${esc(product.name)}
                            </b>

                            <small>
                                ${money(product.price)}
                                each
                            </small>
                        </div>

                        <div class="customer-qty">
                            <button
                                onclick="
                                    changeCustomerCart(
                                        ${product.id},
                                        -1
                                    )
                                "
                            >
                                −
                            </button>

                            <span>
                                ${item.quantity}
                            </span>

                            <button
                                onclick="
                                    changeCustomerCart(
                                        ${product.id},
                                        1
                                    )
                                "
                            >
                                +
                            </button>
                        </div>

                        <strong>
                            ${money(line)}
                        </strong>

                        <button
                            class="customer-remove"
                            onclick="
                                removeFromCustomerCart(
                                    ${product.id}
                                )
                            "
                        >
                            ×
                        </button>
                    </div>
                `;
            })
            .join("");

    content.innerHTML = `
        <div>
            ${rows}
        </div>

        <div class="customer-cart-summary">
            <span>Total</span>
            <strong>${money(total)}</strong>
        </div>

        <button
            class="btn btn-primary btn-full"
            onclick="openCustomerCheckout()"
        >
            Checkout
        </button>
    `;
}

/* =========================================================
   CART SCROLL
========================================================= */

function openCustomerCart() {
    document
        .querySelector(
            ".customer-cart-panel"
        )
        ?.scrollIntoView({
            behavior: "smooth",
            block: "start",
        });
}

/* =========================================================
   CHECKOUT
========================================================= */

function openCustomerCheckout() {
    if (!customerCart.length) {
        toast(
            "Your cart is empty.",
            "error"
        );

        return;
    }

    const total =
        customerCart.reduce(
            (sum, item) => {
                const product =
                    productsCache.find(
                        p =>
                            p.id ===
                            item.product_id
                    );

                return (
                    sum +
                    (
                        product
                            ? Number(product.price) *
                              Number(item.quantity)
                            : 0
                    )
                );
            },
            0
        );

    openModal(`
        <div class="eyebrow">
            CHECKOUT
        </div>

        <h2>
            Complete your order
        </h2>

        <p class="muted small">
            Please enter your delivery details.
        </p>

        <div class="customer-checkout-items">
            ${
                customerCart
                    .map(item => {
                        const product =
                            productsCache.find(
                                p =>
                                    p.id ===
                                    item.product_id
                            );

                        if (!product) {
                            return "";
                        }

                        return `
                            <div>
                                <span>
                                    ${esc(product.name)}
                                    ×
                                    ${item.quantity}
                                </span>

                                <strong>
                                    ${money(
                                        Number(product.price) *
                                        Number(item.quantity)
                                    )}
                                </strong>
                            </div>
                        `;
                    })
                    .join("")
            }
        </div>

        <div class="customer-checkout-total">
            <span>Total</span>
            <strong>${money(total)}</strong>
        </div>

        <div
            class="field"
            style="margin-top:14px"
        >
            <label>Phone number</label>

            <input
                id="customer-phone"
                type="tel"
                placeholder="+92 300 0000000"
                required
            >
        </div>

        <div
            class="field"
            style="margin-top:12px"
        >
            <label>Delivery address</label>

            <textarea
                id="customer-address"
                rows="3"
                placeholder="House, street, area, city"
                required
            ></textarea>
        </div>

        <div
            class="field"
            style="margin-top:12px"
        >
            <label>Order note</label>

            <textarea
                id="customer-order-note"
                rows="2"
                placeholder="Optional delivery instructions"
            ></textarea>
        </div>

        <div class="form-actions">
            <button
                class="ghost"
                onclick="closeModal()"
            >
                Cancel
            </button>

            <button
                class="btn btn-primary"
                onclick="submitCustomerOrder()"
            >
                Place order
            </button>
        </div>
    `);
}

/* =========================================================
   SUBMIT ORDER
========================================================= */

async function submitCustomerOrder() {
    try {
        const phone =
            document
                .querySelector("#customer-phone")
                ?.value.trim();

        const address =
            document
                .querySelector("#customer-address")
                ?.value.trim();

        const note =
            document
                .querySelector("#customer-order-note")
                ?.value.trim();

        if (!phone) {
            toast(
                "Please enter your phone number.",
                "error"
            );

            return;
        }

        if (!address) {
            toast(
                "Please enter your delivery address.",
                "error"
            );

            return;
        }

        const notes = [
            `Phone: ${phone}`,
            `Delivery address: ${address}`,
            note
                ? `Note: ${note}`
                : "",
        ]
            .filter(Boolean)
            .join("\n");

        const order =
    await api(
        "/api/orders",
        {
            method: "POST",
            body: {
                items: customerCart,
                phone: phone,
                address: address,
                notes: note || null,
            },
        }
    );

        customerCart = [];

        saveCustomerCart();

        closeModal();

        toast(
            `Order #${order.id} placed successfully`
        );

        setTimeout(
            () => route("orders"),
            250
        );
    } catch (e) {
        toast(
            e.message,
            "error"
        );
    }
}

/* =========================================================
   CUSTOMER SHELL
========================================================= */

window.renderShell = function () {
    if (me?.role !== "customer") {
        return auraOriginalRenderShell();
    }

    const initial =
        (me.full_name || "C")
            .split(" ")
            .map(x => x[0])
            .slice(0, 2)
            .join("")
            .toUpperCase();

    document.querySelector(
        "#business-mini"
    ).innerHTML = `
        <b>${esc(biz.name)}</b>
        <span>
            Customer · ${esc(biz.currency)}
        </span>
    `;

    document.querySelector(
        "#user-menu"
    ).innerHTML = `
        <span class="avatar">
            ${initial}
        </span>

        <span class="user-meta">
            <b>
                ${esc(me.full_name)}
            </b>

            <small>
                Customer
            </small>
        </span>
    `;

    document.querySelector(
        "#main-nav"
    ).innerHTML = `
        <div class="nav-group">
            Store
        </div>

        <button
            class="nav-item"
            data-page="store"
        >
            <span class="nav-icon">
                ◈
            </span>
            Shop
        </button>

        <button
            class="nav-item"
            data-page="orders"
        >
            <span class="nav-icon">
                ↗
            </span>
            My Orders
        </button>

        <button
            class="nav-item"
            data-page="aura-help"
        >
            <span class="nav-icon">
                ✦
            </span>
            Ask AURA
        </button>

        <button
            class="nav-item"
            data-page="feedback"
        >
            <span class="nav-icon">
                ♡
            </span>
            Feedback
        </button>

        <div class="nav-group">
            Account
        </div>

        <button
            class="nav-item"
            data-page="profile"
        >
            <span class="nav-icon">
                ○
            </span>
            Profile
        </button>
    `;

    document
        .querySelectorAll(".nav-item")
        .forEach(button => {
            button.onclick = () => {
                route(
                    button.dataset.page
                );

                closeSide();
            };
        });
};

/* =========================================================
   CUSTOMER ROUTES
========================================================= */

window.route = function (p) {
    if (me?.role !== "customer") {
        return auraOriginalRoute(p);
    }

    const page =
        p === "dashboard" ||
        p === "store"
            ? "store"
            : p;

    const pages = {
        store:
            customerStorePage,

        orders:
            ordersPage,

        "aura-help":
            customerAuraHelpPage,

        feedback:
            customerFeedbackPage,

        profile:
            profilePage,
    };

    if (!pages[page]) {
        return window.route("store");
    }

    currentPage = page;

    document
        .querySelectorAll(".nav-item")
        .forEach(button => {
            button.classList.toggle(
                "active",
                button.dataset.page === page
            );
        });

    document.querySelector(
        "#breadcrumb"
    ).textContent =
        "AURA / " +
        (
            page === "store"
                ? "SHOP"
                : page
                    .replace("-", " ")
                    .toUpperCase()
        );

    pages[page]();

    history.replaceState(
        null,
        "",
        "/app?page=" + page
    );
};

/* =========================================================
   CUSTOMER SIGNUP AUTO OPEN
========================================================= */

const customerUpgradeInit = () => {
    const signup =
        new URLSearchParams(
            location.search
        ).get("auth") === "signup";

    const authScreen =
        document.querySelector(
            "#auth-screen"
        );

    if (
        authScreen &&
        !authScreen.classList.contains(
            "hidden"
        ) &&
        signup
    ) {
        window.setAuthMode(true);
    }
};

setTimeout(
    customerUpgradeInit,
    0
);