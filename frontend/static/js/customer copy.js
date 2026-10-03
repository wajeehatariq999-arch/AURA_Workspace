
/* AURA Customer Storefront
   Customer signup + store + cart + checkout
*/

const auraOriginalSetAuthMode = window.setAuthMode;
const auraOriginalRenderShell = window.renderShell;
const auraOriginalRoute = window.route;

let customerCart = [];


/* =========================
   CUSTOMER CART
========================= */

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


/* =========================
   CUSTOMER SIGNUP
========================= */

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
                    b =>
                        `<option value="${b.id}">
                            ${esc(b.name)} · ${esc(b.currency)}
                        </option>`
                )
                .join("");

    } catch (e) {

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


/* =========================
   SIGNUP SCREEN
========================= */

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
            data-account-type="owner"
        >

            <div class="eyebrow">
                JOIN AURA
            </div>

            <h1>Create your account</h1>

            <p>
                Choose whether you are creating a business workspace
                or joining a store as a customer.
            </p>


            <div class="customer-account-switch">

                <button
                    type="button"
                    id="account-owner"
                    class="customer-choice active"
                    onclick="setAccountType('owner')"
                >
                    <strong>
                        Business Owner
                    </strong>

                    <small>
                        Create and manage a business
                    </small>
                </button>


                <button
                    type="button"
                    id="account-customer"
                    class="customer-choice"
                    onclick="setAccountType('customer')"
                >
                    <strong>
                        Customer
                    </strong>

                    <small>
                        Browse products and place orders
                    </small>
                </button>

            </div>


            <div class="form-grid">

                <div class="field full">

                    <label>
                        Full name
                    </label>

                    <input
                        id="su-name"
                        required
                        minlength="2"
                        autocomplete="name"
                    >

                </div>


                <div class="field full">

                    <label>
                        Email
                    </label>

                    <input
                        id="su-email"
                        type="email"
                        required
                        autocomplete="email"
                    >

                </div>


                <div class="field full">

                    <label>
                        Password
                    </label>

                    <input
                        id="su-password"
                        type="password"
                        minlength="8"
                        required
                        autocomplete="new-password"
                    >

                </div>

            </div>


            <div id="owner-fields">

                <div
                    class="field full"
                    style="margin-top:12px"
                >

                    <label>
                        Business name
                    </label>

                    <input
                        id="su-business"
                        minlength="2"
                        autocomplete="organization"
                    >

                </div>

            </div>


            <div
                id="customer-fields"
                class="hidden"
            >

                <div
                    class="field full"
                    style="margin-top:12px"
                >

                    <label>
                        Store
                    </label>

                    <select id="su-business-id">

                        <option value="">
                            Loading stores…
                        </option>

                    </select>

                </div>


                <div
                    class="top-note"
                    style="margin-top:10px"
                >
                    Your customer account will be connected
                    to the selected store.
                </div>

            </div>


            <p
                id="auth-error"
                class="error"
            ></p>


            <button
                class="btn btn-primary btn-full"
            >
                Create account
            </button>

        </form>
    `;


    document
        .querySelector("#signup-form")
        .onsubmit = async e => {

            e.preventDefault();

            await authSubmit(true);
        };
};


/* =========================
   LOGIN / SIGNUP SUBMIT
========================= */

window.authSubmit = async function (signup) {

    const error =
        document.querySelector("#auth-error");

    if (error) {
        error.textContent = "";
    }


    try {

        /* LOGIN */

        if (!signup) {

            me = await api(
                "/api/auth/signin",
                {
                    method: "POST",

                    body: {
                        email:
                            document.querySelector(
                                "#si-email"
                            ).value,

                        password:
                            document.querySelector(
                                "#si-password"
                            ).value
                    }
                }
            );

        }


        /* SIGNUP */

        else {

            const form =
                document.querySelector(
                    "#signup-form"
                );

            const type =
                form?.dataset.accountType ||
                "owner";


            /* CUSTOMER SIGNUP */

            if (type === "customer") {

                const businessId =
                    Number(
                        document.querySelector(
                            "#su-business-id"
                        ).value
                    );


                if (!businessId) {

                    throw new Error(
                        "Please choose a store."
                    );
                }


                me = await api(
                    "/api/auth/customer-signup",
                    {
                        method: "POST",

                        body: {

                            full_name:
                                document.querySelector(
                                    "#su-name"
                                ).value,

                            email:
                                document.querySelector(
                                    "#su-email"
                                ).value,

                            password:
                                document.querySelector(
                                    "#su-password"
                                ).value,

                            business_id:
                                businessId
                        }
                    }
                );

            }


            /* OWNER SIGNUP */

            else {

                const businessName =
                    document.querySelector(
                        "#su-business"
                    ).value.trim();


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
                                document.querySelector(
                                    "#su-name"
                                ).value,

                            email:
                                document.querySelector(
                                    "#su-email"
                                ).value,

                            password:
                                document.querySelector(
                                    "#su-password"
                                ).value,

                            business_name:
                                businessName
                        }
                    }
                );
            }
        }


        await enter();

    } catch (e) {

        if (error) {
            error.textContent =
                e.message;
        }
    }
};


/* =========================
   PRODUCT CARD
========================= */

function customerProductCard(p) {

    const img =
        p.images?.find(
            x => x.is_primary
        ) ||
        p.images?.[0];


    const unavailable =
        !p.is_available ||
        p.stock <= 0;


    return `

        <article class="customer-product card">

            <div class="customer-product-image">

                ${
                    img

                        ? `
                            <img
                                src="${img.url}"
                                alt="${esc(p.name)}"
                                loading="lazy"
                            >
                          `

                        : `
                            <div class="customer-no-image">
                                AURA
                            </div>
                          `
                }

            </div>


            <div class="customer-product-body">

                <div class="small muted">
                    ${esc(
                        p.category ||
                        "Product"
                    )}
                </div>


                <h3>
                    ${esc(p.name)}
                </h3>


                <p>
                    ${esc(
                        p.description ||
                        "No description provided."
                    )}
                </p>


                <div class="customer-product-footer">

                    <strong class="price">
                        ${money(p.price)}
                    </strong>


                    <span class="small muted">

                        ${
                            unavailable

                                ? "Unavailable"

                                : `${p.stock} in stock`
                        }

                    </span>

                </div>


                <button
                    class="btn btn-primary btn-full"
                    style="margin-top:12px"

                    ${unavailable ? "disabled" : ""}

                    onclick="
                        addToCustomerCart(${p.id})
                    "
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


/* =========================
   CUSTOMER STORE
========================= */

async function customerStorePage() {

    try {

        const [
            ps,
            business
        ] = await Promise.all([

            api("/api/products"),

            api("/api/business")

        ]);


        productsCache = ps;

        biz = business;

        currency =
            biz.currency;


        loadCustomerCart();


        document.querySelector(
            "#page"
        ).innerHTML = `


            <div class="customer-store-head">

                <div>

                    <div class="eyebrow">

                        WELCOME TO
                        ${esc(
                            biz.name
                        ).toUpperCase()}

                    </div>


                    <h1>
                        Shop the store
                    </h1>


                    <p>
                        Browse available products,
                        add them to your cart
                        and place your order.
                    </p>

                </div>


                <button
                    class="btn btn-primary"
                    onclick="openCustomerCart()"
                >

                    🛒 Cart

                    <span
                        id="customer-cart-count"
                        class="customer-cart-count"
                    >
                        0
                    </span>

                </button>

            </div>


            <div class="customer-store-layout">


                <section>

                    <div
                        class="customer-product-grid"
                    >

                        ${
                            ps.map(
                                customerProductCard
                            ).join("")

                            ||

                            `
                                <div class="empty">
                                    This store has
                                    no products yet.
                                </div>
                            `
                        }

                    </div>

                </section>


                <aside
                    class="
                        card
                        customer-cart-panel
                    "
                >

                    <div class="card-title">

                        <h3>
                            Your cart
                        </h3>


                        <span
                            id="customer-cart-total-items"
                            class="status"
                        >
                            0 items
                        </span>

                    </div>


                    <div
                        id="customer-cart-content"
                    ></div>

                </aside>

            </div>

        `;


        renderCustomerCart();


    } catch (e) {

        document.querySelector(
            "#page"
        ).innerHTML = `

            <div class="empty">

                <h2>
                    Store could not be loaded
                </h2>

                <p>
                    ${esc(e.message)}
                </p>

                <button
                    class="btn btn-primary"
                    onclick="
                        customerStorePage()
                    "
                >
                    Try again
                </button>

            </div>
        `;
    }
}


/* =========================
   ADD TO CART
========================= */

function addToCustomerCart(
    productId
) {

    const product =
        productsCache.find(
            p => p.id === productId
        );


    if (
        !product ||
        !product.is_available ||
        product.stock <= 0
    ) {
        return;
    }


    const existing =
        customerCart.find(
            x =>
                x.product_id ===
                productId
        );


    if (existing) {

        if (
            existing.quantity >=
            product.stock
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

            product_id:
                productId,

            quantity:
                1

        });
    }


    saveCustomerCart();

    renderCustomerCart();


    toast(
        `${product.name} added to cart`
    );
}


/* =========================
   CHANGE QUANTITY
========================= */

function changeCustomerCart(
    productId,
    delta
) {

    const row =
        customerCart.find(
            x =>
                x.product_id ===
                productId
        );


    const product =
        productsCache.find(
            p =>
                p.id ===
                productId
        );


    if (!row || !product) {
        return;
    }


    row.quantity += delta;


    if (
        row.quantity <= 0
    ) {

        customerCart =
            customerCart.filter(
                x =>
                    x.product_id !==
                    productId
            );

    }

    else if (
        row.quantity >
        product.stock
    ) {

        row.quantity =
            product.stock;


        toast(
            "Quantity limited to available stock.",
            "error"
        );
    }


    saveCustomerCart();

    renderCustomerCart();
}


/* =========================
   REMOVE FROM CART
========================= */

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


/* =========================
   RENDER CART
========================= */

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
            (
                sum,
                x
            ) =>
                sum +
                Number(
                    x.quantity || 0
                ),
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
        countEl.textContent =
            count;
    }


    if (totalItemsEl) {

        totalItemsEl.textContent =
            `${count} item${
                count === 1
                    ? ""
                    : "s"
            }`;
    }


    if (!customerCart.length) {

        content.innerHTML = `

            <div class="customer-empty-cart">

                <div class="customer-empty-icon">
                    🛒
                </div>

                <b>
                    Your cart is empty
                </b>

                <span>
                    Add products to start
                    your order.
                </span>

            </div>

        `;

        return;
    }


    let total = 0;


    const rows =
        customerCart
            .map(item => {

                const p =
                    productsCache.find(
                        product =>
                            product.id ===
                            item.product_id
                    );


                if (!p) {
                    return "";
                }


                const line =
                    Number(p.price) *
                    Number(
                        item.quantity
                    );


                total += line;


                return `

                    <div
                        class="customer-cart-row"
                    >

                        <div>

                            <b>
                                ${esc(
                                    p.name
                                )}
                            </b>

                            <small>
                                ${money(
                                    p.price
                                )}
                                each
                            </small>

                        </div>


                        <div
                            class="customer-qty"
                        >

                            <button
                                onclick="
                                    changeCustomerCart(
                                        ${p.id},
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
                                        ${p.id},
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
                                    ${p.id}
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


        <div
            class="customer-cart-summary"
        >

            <span>
                Total
            </span>

            <strong>
                ${money(total)}
            </strong>

        </div>


        <button
            class="
                btn
                btn-primary
                btn-full
            "
            onclick="
                openCustomerCheckout()
            "
        >
            Checkout
        </button>

    `;
}


/* =========================
   CART BUTTON
========================= */

function openCustomerCart() {

    document
        .querySelector(
            ".customer-cart-panel"
        )
        ?.scrollIntoView({

            behavior:
                "smooth",

            block:
                "start"
        });
}


/* =========================
   CHECKOUT
========================= */

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
            (
                sum,
                item
            ) => {

                const p =
                    productsCache.find(
                        product =>
                            product.id ===
                            item.product_id
                    );


                return (
                    sum +
                    (
                        p
                            ? Number(
                                p.price
                              ) *
                              item.quantity
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
            Place your order
        </h2>


        <p class="muted small">
            Review your order and add
            an optional note for the store.
        </p>


        <div
            class="
                customer-checkout-items
            "
        >

            ${
                customerCart
                    .map(item => {

                        const p =
                            productsCache.find(
                                product =>
                                    product.id ===
                                    item.product_id
                            );


                        if (!p) {
                            return "";
                        }


                        return `

                            <div>

                                <span>
                                    ${esc(
                                        p.name
                                    )}
                                    ×
                                    ${item.quantity}
                                </span>

                                <strong>
                                    ${money(
                                        Number(
                                            p.price
                                        ) *
                                        item.quantity
                                    )}
                                </strong>

                            </div>

                        `;

                    })
                    .join("")
            }

        </div>


        <div
            class="
                customer-checkout-total
            "
        >

            <span>
                Total
            </span>

            <strong>
                ${money(total)}
            </strong>

        </div>


        <div
            class="field"
            style="margin-top:14px"
        >

            <label>
                Order note (optional)
            </label>

            <textarea
                id="customer-order-note"
                rows="3"
                placeholder="
                    Delivery instructions
                    or a note for the store
                "
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
                onclick="
                    submitCustomerOrder()
                "
            >
                Place order
            </button>

        </div>

    `);
}


/* =========================
   PLACE ORDER
========================= */

async function submitCustomerOrder() {

    try {

        const note =
            document.querySelector(
                "#customer-order-note"
            )?.value.trim() ||
            null;


        const order =
            await api(
                "/api/orders",
                {
                    method: "POST",

                    body: {

                        items:
                            customerCart,

                        notes:
                            note
                    }
                }
            );


        customerCart = [];

        saveCustomerCart();

        closeModal();


        toast(
            `Order #${order.id} placed successfully`
        );


        setTimeout(
            () => {
                route("orders");
            },
            250
        );


    } catch (e) {

        toast(
            e.message,
            "error"
        );
    }
}


/* =========================
   CUSTOMER SHELL
========================= */

window.renderShell = function () {

    if (
        me?.role !==
        "customer"
    ) {

        return auraOriginalRenderShell();
    }


    const initial =
        (me.full_name || "C")
            .split(" ")
            .map(
                x => x[0]
            )
            .slice(0, 2)
            .join("")
            .toUpperCase();


    document.querySelector(
        "#business-mini"
    ).innerHTML = `

        <b>
            ${esc(biz.name)}
        </b>

        <span>
            Customer ·
            ${esc(biz.currency)}
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
                ${esc(
                    me.full_name
                )}
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
        .querySelectorAll(
            ".nav-item"
        )
        .forEach(
            button => {

                button.onclick =
                    () => {

                        route(
                            button.dataset.page
                        );

                        closeSide();
                    };
            }
        );
};


/* =========================
   CUSTOMER ROUTES
========================= */

window.route = function (p) {

    if (
        me?.role !==
        "customer"
    ) {

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

        profile:
            profilePage
    };


    if (!pages[page]) {

        return window.route(
            "store"
        );
    }


    currentPage =
        page;


    document
        .querySelectorAll(
            ".nav-item"
        )
        .forEach(
            button =>
                button.classList.toggle(
                    "active",
                    button.dataset.page ===
                        page
                )
        );


    document.querySelector(
        "#breadcrumb"
    ).textContent =

        "AURA / " +

        (
            page === "store"

                ? "SHOP"

                : page
                    .replace(
                        "-",
                        " "
                    )
                    .toUpperCase()
        );


    pages[page]();


    history.replaceState(
        null,
        "",
        "/app?page=" +
            page
    );
};


/* =========================
   AUTO OPEN CUSTOMER SIGNUP
========================= */

const customerUpgradeInit =
    () => {

        const signup =
            new URLSearchParams(
                location.search
            ).get("auth") ===
            "signup";


        if (

            document.querySelector(
                "#auth-screen"
            ) &&

            !document
                .querySelector(
                    "#auth-screen"
                )
                .classList
                .contains("hidden") &&

            signup

        ) {

            window.setAuthMode(
                true
            );
        }
    };


setTimeout(
    customerUpgradeInit,
    0
);
