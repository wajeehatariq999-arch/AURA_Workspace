
let me = null,
    biz = null,
    currentPage = 'dashboard',
    productsCache = [],
    categoriesCache = [],
    currency = 'PKR';

const $ = s => document.querySelector(s);

const esc = v => {
    const d = document.createElement('div');
    d.textContent = v ?? '';
    return d.innerHTML;
};

const money = v =>
    new Intl.NumberFormat('en-PK', {
        style: 'currency',
        currency: currency || 'PKR',
        maximumFractionDigits: 0
    }).format(Number(v || 0));

const date = v =>
    v
        ? new Date(v).toLocaleString('en-PK', {
              dateStyle: 'medium',
              timeStyle: 'short'
          })
        : '—';

const readCookie = n =>
    document.cookie
        .split('; ')
        .find(x => x.startsWith(n + '='))
        ?.split('=')[1] || '';


// ============================================================
// API HELPER
// ============================================================

async function api(url, opt = {}) {
    const o = {
        credentials: 'same-origin',
        ...opt,
        headers: {
            ...(opt.headers || {})
        }
    };

    if (
        o.body &&
        typeof o.body !== 'string' &&
        !(o.body instanceof FormData) &&
        !(o.body instanceof URLSearchParams)
    ) {
        o.headers['Content-Type'] = 'application/json';
        o.body = JSON.stringify(o.body);
    }

    if (
        ['POST', 'PUT', 'PATCH', 'DELETE'].includes(
            o.method || 'GET'
        )
    ) {
        o.headers['X-CSRF-Token'] =
            decodeURIComponent(
                readCookie('csrf_token')
            );
    }

    const r = await fetch(url, o);

    let d = {};

    try {
        d = await r.json();
    } catch {}

    if (!r.ok) {
        if (Array.isArray(d.detail)) {
            const messages = d.detail.map(error => {
                const location =
                    Array.isArray(error.loc)
                        ? error.loc.join('.')
                        : '';

                return location
                    ? `${location}: ${error.msg}`
                    : error.msg;
            });

            throw new Error(
                messages.join('\n')
            );
        }

        throw new Error(
            typeof d.detail === 'string'
                ? d.detail
                : 'Request could not be completed'
        );
    }

    return d;
}


// ============================================================
// TOAST
// ============================================================

function toast(msg, type = '') {
    const root = $('#toast-root');

    if (!root) return;

    const el = document.createElement('div');

    el.className = 'toast ' + type;
    el.textContent = msg;

    Object.assign(el.style, {
        position: 'fixed',
        right: '20px',
        bottom: '20px',
        zIndex: 200,
        background:
            type === 'error'
                ? '#a95042'
                : '#173c32',
        color: '#fff',
        padding: '12px 15px',
        borderRadius: '10px',
        fontSize: '11px',
        boxShadow: '0 12px 30px rgba(0,0,0,.2)'
    });

    root.appendChild(el);

    setTimeout(() => el.remove(), 3300);
}


// ============================================================
// AUTH MODE
// ============================================================

function setAuthMode(signup = false) {
    $('#signin-tab').classList.toggle(
        'active',
        !signup
    );

    $('#signup-tab').classList.toggle(
        'active',
        signup
    );

    $('#auth-panel').innerHTML = signup
        ? `
        <form id="signup-form" class="auth-form">

            <div class="eyebrow">
                START YOUR WORKSPACE
            </div>

            <h1>Create AURA</h1>

            <p>
                Create a business workspace.
                You can manage everything from
                the application after signing in.
            </p>

            <div class="form-grid">

                <div class="field full">
                    <label>Full name</label>
                    <input
                        id="su-name"
                        required
                        minlength="2"
                    >
                </div>

                <div class="field full">
                    <label>Business name</label>
                    <input
                        id="su-business"
                        required
                        minlength="2"
                    >
                </div>

                <div class="field full">
                    <label>Email</label>
                    <input
                        id="su-email"
                        type="email"
                        required
                    >
                </div>

                <div class="field full">
                    <label>Password</label>
                    <input
                        id="su-password"
                        type="password"
                        minlength="8"
                        required
                    >
                </div>

            </div>

            <p id="auth-error" class="error"></p>

            <button class="btn btn-primary btn-full">
                Create workspace
            </button>

        </form>
        `
        : `
        <form id="signin-form" class="auth-form">

            <div class="eyebrow">
                WELCOME BACK
            </div>

            <h1>Sign in to AURA</h1>

            <p>
                Access your role-based business
                workspace and AI Command Center.
            </p>

            <div class="grid">

                <div class="field">
                    <label>Email</label>
                    <input
                        id="si-email"
                        type="email"
                        required
                        autocomplete="email"
                    >
                </div>

                <div class="field">
                    <label>Password</label>
                    <input
                        id="si-password"
                        type="password"
                        required
                        autocomplete="current-password"
                    >
                </div>

            </div>

            <p id="auth-error" class="error"></p>

            <button class="btn btn-primary btn-full">
                Sign in
            </button>

        </form>
        `;

    if (signup) {
        $('#signup-form').onsubmit = async e => {
            e.preventDefault();
            await authSubmit(true);
        };
    } else {
        $('#signin-form').onsubmit = async e => {
            e.preventDefault();
            await authSubmit(false);
        };
    }
}


// ============================================================
// AUTH SUBMIT
// ============================================================

async function authSubmit(signup) {
    $('#auth-error').textContent = '';

    try {
        me = signup
            ? await api('/api/auth/signup', {
                  method: 'POST',
                  body: {
                      full_name: $('#su-name').value,
                      email: $('#su-email').value,
                      password: $('#su-password').value,
                      business_name:
                          $('#su-business').value
                  }
              })
            : await api('/api/auth/signin', {
                  method: 'POST',
                  body: {
                      email: $('#si-email').value,
                      password: $('#si-password').value
                  }
              });

        await enter();

    } catch (e) {
        $('#auth-error').textContent =
            e.message;
    }
}


// ============================================================
// ENTER APPLICATION
// ============================================================

async function enter() {
    biz = await api('/api/business');

    currency = biz.currency;

    $('#auth-screen').classList.add('hidden');
    $('#app-shell').classList.remove('hidden');

    renderShell();

    route(
        new URLSearchParams(location.search)
            .get('page') || 'dashboard'
    );
}


// ============================================================
// SHELL
// ============================================================

function renderShell() {
    const initial =
        (me.full_name || 'A')
            .split(' ')
            .map(x => x[0])
            .slice(0, 2)
            .join('')
            .toUpperCase();

    $('#business-mini').innerHTML = `
        <b>${esc(biz.name)}</b>
        <span>
            ${esc(me.role)} ·
            ${esc(biz.currency)}
        </span>
    `;

    $('#user-menu').innerHTML = `
        <span class="avatar">
            ${initial}
        </span>

        <span class="user-meta">
            <b>${esc(me.full_name)}</b>
            <small>${esc(me.role)}</small>
        </span>
    `;

    const common = [
        ['dashboard', '⌂', 'Overview'],
        ['ai', '✦', 'AI Command Center'],
        ['products', '◈', 'Products'],
        ['inventory', '▦', 'Inventory'],
        ['orders', '↗', 'Orders'],
        ['suppliers', '◇', 'Suppliers'],
        ['analytics', '◌', 'Analytics'],
        ['activity', '◍', 'Agent Activity']
    ];

    let nav = `
        <div class="nav-group">
            Workspace
        </div>

        ${common
            .map(
                x => `
                <button
                    class="nav-item"
                    data-page="${x[0]}"
                >
                    <span class="nav-icon">
                        ${x[1]}
                    </span>
                    ${x[2]}
                </button>
                `
            )
            .join('')}
    `;

    if (['owner', 'admin'].includes(me.role)) {
        nav += `
            <div class="nav-group">
                Control
            </div>

            <button
                class="nav-item"
                data-page="knowledge"
            >
                <span class="nav-icon">⌁</span>
                Knowledge Base
            </button>

            <button
                class="nav-item"
                data-page="approvals"
            >
                <span class="nav-icon">✓</span>
                Approval Center
            </button>

            <button
                class="nav-item"
                data-page="security"
            >
                <span class="nav-icon">◉</span>
                Security & Audit
            </button>

            <button
                class="nav-item"
                data-page="settings"
            >
                <span class="nav-icon">⚙</span>
                Business Settings
            </button>
        `;
    } else {
        nav += `
            <div class="nav-group">
                Account
            </div>

            <button
                class="nav-item"
                data-page="profile"
            >
                <span class="nav-icon">○</span>
                Profile
            </button>
        `;
    }

    $('#main-nav').innerHTML = nav;

    document
        .querySelectorAll('.nav-item')
        .forEach(b => {
            b.onclick = () => {
                route(b.dataset.page);
                closeSide();
            };
        });
}


// ============================================================
// ROUTING
// ============================================================

function route(p) {
    currentPage = p;

    document
        .querySelectorAll('.nav-item')
        .forEach(b =>
            b.classList.toggle(
                'active',
                b.dataset.page === p
            )
        );

    $('#breadcrumb').textContent =
        'AURA / ' +
        (
            p === 'ai'
                ? 'AI COMMAND CENTER'
                : p
                    .replace('-', ' ')
                    .toUpperCase()
        );

    const pages = {
        dashboard: dashboardPage,
        ai: aiPage,
        products: productsPage,
        inventory: inventoryPage,
        orders: ordersPage,
        suppliers: suppliersPage,
        analytics: analyticsPage,
        activity: activityPage,
        knowledge: knowledgePage,
        approvals: approvalsPage,
        security: securityPage,
        settings: settingsPage,
        profile: profilePage
    };

    (pages[p] || dashboardPage)();

    history.replaceState(
        null,
        '',
        '/app?page=' + p
    );
}


function closeSide() {
    $('.sidebar')?.classList.remove('open');
    $('#scrim')?.classList.remove('open');
}


// ============================================================
// DASHBOARD
// ============================================================

async function dashboardPage() {
    const [d, acts] = await Promise.all([
        api('/api/dashboard'),
        api('/api/insights/analytics')
    ]);

    $('#page').innerHTML = `
        <div class="page-head">

            <div>
                <div class="eyebrow">
                    BUSINESS OVERVIEW
                </div>

                <h1>
                    Good to see you,
                    ${esc(
                        (me.full_name || '')
                            .split(' ')[0]
                    )}.
                </h1>

                <p>
                    Your operating picture,
                    grounded in live business data.
                </p>
            </div>

            <button
                class="btn btn-primary"
                onclick="route('ai')"
            >
                ✦ Ask AURA
            </button>

        </div>

        <div class="grid grid-4">

            <div class="card metric">
                <div class="metric-label">
                    Revenue
                </div>

                <div class="metric-value">
                    ${money(
                        d.revenue ?? acts.revenue
                    )}
                </div>

                <div class="metric-note">
                    Non-cancelled orders
                </div>
            </div>

            <div class="card metric">
                <div class="metric-label">
                    Orders
                </div>

                <div class="metric-value">
                    ${d.orders}
                </div>

                <div class="metric-note">
                    All business orders
                </div>
            </div>

            <div class="card metric">
                <div class="metric-label">
                    Low stock
                </div>

                <div class="metric-value">
                    ${d.low_stock}
                </div>

                <div class="metric-note">
                    At or below reorder level
                </div>
            </div>

            <div class="card metric">
                <div class="metric-label">
                    Products
                </div>

                <div class="metric-value">
                    ${d.products}
                </div>

                <div class="metric-note">
                    Catalog records
                </div>
            </div>

        </div>

        <div
            class="grid grid-2"
            style="margin-top:15px"
        >

            <div class="card">

                <div class="card-title">
                    <h3>7-day revenue</h3>

                    <button
                        class="ghost"
                        onclick="route('analytics')"
                    >
                        Full analytics
                    </button>
                </div>

                ${revenueChart(
                    acts.daily_revenue
                )}

            </div>

            <div class="card">

                <div class="card-title">
                    <h3>Business signals</h3>
                    <span class="status">
                        LIVE DATA
                    </span>
                </div>

                <div class="grid grid-2">

                    <div class="top-note">
                        ${acts.pending_orders}
                        active/pending orders
                    </div>

                    <div class="top-note">
                        ${acts.out_of_stock}
                        out of stock
                    </div>

                    <div class="top-note">
                        ${acts.low_stock}
                        low-stock items
                    </div>

                    <div class="top-note">
                        ${acts.top_products.length}
                        products with sales
                    </div>

                </div>

                <div style="margin-top:20px">

                    <div class="small muted">
                        Top products
                    </div>

                    ${
                        acts.top_products
                            .map(
                                x => `
                                <div class="activity-row">

                                    <div class="activity-icon">
                                        ◈
                                    </div>

                                    <div>
                                        <b>
                                            ${esc(x.name)}
                                        </b>

                                        <small>
                                            ${x.units}
                                            units sold
                                        </small>
                                    </div>

                                    <span class="status">
                                        ${x.units}
                                    </span>

                                </div>
                                `
                            )
                            .join('') ||
                        `
                        <div class="empty">
                            No sales data yet.
                        </div>
                        `
                    }

                </div>

            </div>

        </div>

        <div
            class="grid grid-2"
            style="margin-top:15px"
        >

            <div class="card">

                <div class="card-title">
                    <h3>
                        What needs attention
                    </h3>
                </div>

                ${
                    d.low_stock
                        ? `
                        <div class="top-note">
                            Inventory has
                            ${d.low_stock}
                            item(s) at or below
                            reorder level.
                            Ask AURA to inspect
                            and prepare a supplier
                            request.
                        </div>
                        `
                        : `
                        <div class="top-note">
                            No products are currently
                            at or below their reorder
                            level.
                        </div>
                        `
                }

            </div>

            <div class="card">

                <div class="card-title">

                    <h3>
                        Recent AI activity
                    </h3>

                    <button
                        class="ghost"
                        onclick="route('activity')"
                    >
                        View all
                    </button>

                </div>

                <div id="dash-activity">
                    Loading…
                </div>

            </div>

        </div>
    `;

    loadRecentActivity(
        '#dash-activity'
    );
}


function revenueChart(xs) {
    const max = Math.max(
        ...xs.map(x => x.revenue),
        1
    );

    return `
        <div class="chart">

            ${xs
                .map(
                    x => `
                    <div class="bar-col">

                        <span class="bar-value">
                            ${Math.round(x.revenue)}
                        </span>

                        <div
                            class="bar"
                            style="
                                height:
                                ${Math.max(
                                    4,
                                    x.revenue /
                                        max *
                                        150
                                )}px
                            "
                        ></div>

                        <span class="bar-label">
                            ${x.date.slice(5)}
                        </span>

                    </div>
                    `
                )
                .join('')}

        </div>
    `;
}


// ============================================================
// PRODUCTS
// ============================================================

async function productsPage() {
    const [ps, cs] = await Promise.all([
        api('/api/products'),
        api('/api/categories')
    ]);

    productsCache = ps;
    categoriesCache = cs;

    const owner =
        ['owner', 'admin'].includes(
            me.role
        );

    $('#page').innerHTML = `
        <div class="page-head">

            <div>

                <div class="eyebrow">
                    CATALOG
                </div>

                <h1>
                    Products
                </h1>

                <p>
                    Manage the real catalog
                    your customers and agents use.
                </p>

            </div>

            ${
                owner
                    ? `
                    <div
                        style="
                            display:flex;
                            gap:7px
                        "
                    >

                        <button
                            class="ghost"
                            onclick="categoryModal()"
                        >
                            + Category
                        </button>

                        <button
                            class="btn btn-primary"
                            onclick="productModal()"
                        >
                            + Add product
                        </button>

                    </div>
                    `
                    : ''
            }

        </div>

        <div class="product-grid">

            ${
                ps.map(productCard).join('') ||
                `
                <div
                    class="empty"
                    style="grid-column:1/-1"
                >
                    No products yet.
                    Add your first product.
                </div>
                `
            }

        </div>
    `;
}


function productCard(p) {
    const img =
        p.images?.find(
            x => x.is_primary
        ) ||
        p.images?.[0];

    const status =
        p.stock <= 0
            ? 'out'
            : p.stock <= p.reorder_level
                ? 'low'
                : 'ok';

    return `
        <article class="card product-card">

            <div class="product-media">

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
                        <div class="no-image">
                            AURA
                        </div>
                        `
                }

                <span
                    class="
                        status
                        ${
                            status === 'low'
                                ? 'low'
                                : status === 'out'
                                    ? 'out'
                                    : ''
                        }
                    "
                    style="
                        position:absolute;
                        top:12px;
                        right:12px
                    "
                >
                    ${
                        status === 'out'
                            ? 'Out of stock'
                            : status === 'low'
                                ? 'Low stock'
                                : 'In stock'
                    }
                </span>

            </div>

            <div class="product-body">

                <div class="small muted">
                    ${esc(
                        p.category ||
                        'Uncategorised'
                    )}
                </div>

                <h3>
                    ${esc(p.name)}
                </h3>

                <p>
                    ${esc(
                        p.description ||
                        'No description provided.'
                    )}
                </p>

                <div class="product-foot">

                    <span class="price">
                        ${money(p.price)}
                    </span>

                    <span class="small muted">
                        ${p.stock} units
                    </span>

                </div>

                ${
                    ['owner', 'admin'].includes(
                        me.role
                    )
                        ? `
                        <div
                            class="product-actions"
                            style="margin-top:12px"
                        >

                            <button
                                class="ghost"
                                onclick="productModal(${p.id})"
                            >
                                Edit
                            </button>

                            <button
                                class="ghost danger"
                                onclick="deleteProduct(${p.id})"
                            >
                                Delete
                            </button>

                            <button
                                class="ghost"
                                onclick="imageModal(${p.id})"
                            >
                                Images
                            </button>

                        </div>
                        `
                        : `
                        <button
                            class="btn btn-primary btn-full"
                            style="margin-top:12px"
                            onclick="orderModal(${p.id})"
                        >
                            Order
                        </button>
                        `
                }

            </div>

        </article>
    `;
}


// ============================================================
// PRODUCT MODAL
// ============================================================

function productModal(id) {
    const p = id
        ? productsCache.find(
              x => x.id === id
          )
        : null;

    openModal(`
        <div class="eyebrow">
            ${p ? 'EDIT PRODUCT' : 'NEW PRODUCT'}
        </div>

        <h2>
            ${p ? 'Edit' : 'Add'} product
        </h2>

        <form id="product-form">

            <div class="form-grid">

                <div class="field">

                    <label>Name</label>

                    <input
                        id="p-name"
                        value="${esc(p?.name || '')}"
                        required
                    >

                </div>

                <div class="field">

                    <label>Category</label>

                    <select id="p-cat">

                        <option value="">
                            No category
                        </option>

                        ${categoriesCache
                            .map(
                                c => `
                                <option
                                    value="${c.id}"
                                    ${
                                        p?.category_id ===
                                        c.id
                                            ? 'selected'
                                            : ''
                                    }
                                >
                                    ${esc(c.name)}
                                </option>
                                `
                            )
                            .join('')}

                    </select>

                </div>

                <div class="field">

                    <label>Price</label>

                    <input
                        id="p-price"
                        type="number"
                        min="0"
                        step="0.01"
                        value="${p?.price ?? ''}"
                        required
                    >

                </div>

                <div class="field">

                    <label>Stock</label>

                    <input
                        id="p-stock"
                        type="number"
                        min="0"
                        value="${p?.stock ?? 0}"
                        required
                    >

                </div>

                <div class="field">

                    <label>
                        Reorder level
                    </label>

                    <input
                        id="p-reorder"
                        type="number"
                        min="0"
                        value="${p?.reorder_level ?? 5}"
                        required
                    >

                </div>

                <div class="field">

                    <label>
                        Availability
                    </label>

                    <select id="p-avail">

                        <option
                            value="true"
                            ${
                                p?.is_available !== false
                                    ? 'selected'
                                    : ''
                            }
                        >
                            Available
                        </option>

                        <option
                            value="false"
                            ${
                                p?.is_available === false
                                    ? 'selected'
                                    : ''
                            }
                        >
                            Unavailable
                        </option>

                    </select>

                </div>

                <div class="field full">

                    <label>
                        Description
                    </label>

                    <textarea
                        id="p-desc"
                        rows="5"
                    >${esc(
                        p?.description || ''
                    )}</textarea>

                </div>

            </div>

            <div class="form-actions">

                <button
                    type="button"
                    class="ghost"
                    onclick="closeModal()"
                >
                    Cancel
                </button>

                <button
                    class="btn btn-primary"
                >
                    ${
                        p
                            ? 'Save changes'
                            : 'Create product'
                    }
                </button>

            </div>

        </form>
    `);

    $('#product-form').onsubmit =
        async e => {
            e.preventDefault();

            const body = {
                name: $('#p-name').value,
                category_id:
                    $('#p-cat').value
                        ? Number(
                              $('#p-cat').value
                          )
                        : null,
                price: Number(
                    $('#p-price').value
                ),
                stock: Number(
                    $('#p-stock').value
                ),
                reorder_level: Number(
                    $('#p-reorder').value
                ),
                is_available:
                    $('#p-avail').value ===
                    'true',
                description:
                    $('#p-desc').value ||
                    null
            };

            try {
                await api(
                    p
                        ? '/api/products/' + id
                        : '/api/products',
                    {
                        method: p
                            ? 'PATCH'
                            : 'POST',
                        body
                    }
                );

                closeModal();

                toast(
                    p
                        ? 'Product updated'
                        : 'Product created'
                );

                productsPage();

            } catch (err) {
                toast(
                    err.message,
                    'error'
                );
            }
        };
}


// ============================================================
// CATEGORY
// ============================================================

function categoryModal() {
    openModal(`
        <div class="eyebrow">
            CATALOG STRUCTURE
        </div>

        <h2>
            New category
        </h2>

        <form id="cat-form">

            <div class="field">

                <label>
                    Name
                </label>

                <input
                    id="cat-name"
                    required
                >

            </div>

            <div
                class="field"
                style="margin-top:12px"
            >

                <label>
                    Description
                </label>

                <textarea
                    id="cat-desc"
                    rows="3"
                ></textarea>

            </div>

            <div class="form-actions">

                <button
                    type="button"
                    class="ghost"
                    onclick="closeModal()"
                >
                    Cancel
                </button>

                <button
                    class="btn btn-primary"
                >
                    Create category
                </button>

            </div>

        </form>
    `);

    $('#cat-form').onsubmit =
        async e => {
            e.preventDefault();

            try {
                await api(
                    '/api/categories',
                    {
                        method: 'POST',
                        body: {
                            name:
                                $('#cat-name')
                                    .value,
                            description:
                                $('#cat-desc')
                                    .value ||
                                null
                        }
                    }
                );

                closeModal();

                toast(
                    'Category created'
                );

                productsPage();

            } catch (err) {
                toast(
                    err.message,
                    'error'
                );
            }
        };
}


// ============================================================
// DELETE PRODUCT
// ============================================================

async function deleteProduct(id) {
    if (
        !confirm(
            'Delete this product and its images?'
        )
    ) {
        return;
    }

    try {
        await api(
            '/api/products/' + id,
            {
                method: 'DELETE'
            }
        );

        toast(
            'Product deleted'
        );

        productsPage();

    } catch (e) {
        toast(
            e.message,
            'error'
        );
    }
}


// ============================================================
// PRODUCT IMAGES
// ============================================================

function imageModal(id) {
    const p =
        productsCache.find(
            x => x.id === id
        );

    if (!p) return;

    openModal(`
        <div class="eyebrow">
            PRODUCT IMAGES
        </div>

        <h2>
            ${esc(p.name)}
        </h2>

        <p class="muted small">
            Upload additional images
            or choose a primary image
            during upload.
        </p>

        <form id="img-form">

            <div class="field">

                <label>
                    Image
                </label>

                <input
                    id="img-file"
                    type="file"
                    accept="
                        image/jpeg,
                        image/png,
                        image/webp
                    "
                    required
                >

            </div>

            <label
                style="
                    display:flex;
                    gap:7px;
                    align-items:center;
                    font-size:11px;
                    margin-top:10px
                "
            >

                <input
                    id="img-primary"
                    type="checkbox"
                    checked
                >

                Make primary

            </label>

            <div class="form-actions">

                <button
                    class="btn btn-primary"
                >
                    Upload image
                </button>

            </div>

        </form>

        <div style="margin-top:20px">

            ${
                p.images
                    ?.map(
                        i => `
                        <div
                            class="activity-row"
                        >

                            <img
                                class="logo-thumb"
                                src="${i.url}"
                            >

                            <div>
                                <b>
                                    ${
                                        i.is_primary
                                            ? 'Primary image'
                                            : 'Product image'
                                    }
                                </b>
                            </div>

                            <button
                                class="ghost danger"
                                onclick="
                                    deleteImage(
                                        ${i.id},
                                        ${id}
                                    )
                                "
                            >
                                Delete
                            </button>

                        </div>
                        `
                    )
                    .join('') ||
                `
                <div class="empty">
                    No images yet.
                </div>
                `
            }

        </div>
    `);

    $('#img-form').onsubmit =
        async e => {
            e.preventDefault();

            const fd =
                new FormData();

            fd.append(
                'file',
                $('#img-file')
                    .files[0]
            );

            fd.append(
                'primary',
                $('#img-primary')
                    .checked
            );

            try {
                await uploadForm(
                    '/api/products/' +
                        id +
                        '/images',
                    fd
                );

                closeModal();

                toast(
                    'Image uploaded'
                );

                productsPage();

            } catch (err) {
                toast(
                    err.message,
                    'error'
                );
            }
        };
}


async function deleteImage(
    imageId,
    productId
) {
    try {
        await api(
            '/api/product-images/' +
                imageId,
            {
                method: 'DELETE'
            }
        );

        toast(
            'Image deleted'
        );

        imageModal(productId);

    } catch (e) {
        toast(
            e.message,
            'error'
        );
    }
}


async function uploadForm(
    url,
    fd
) {
    const r =
        await fetch(
            url,
            {
                method: 'POST',
                credentials:
                    'same-origin',
                headers: {
                    'X-CSRF-Token':
                        decodeURIComponent(
                            readCookie(
                                'csrf_token'
                            )
                        )
                },
                body: fd
            }
        );

    let d = {};

    try {
        d = await r.json();
    } catch {}

    if (!r.ok) {
        if (
            Array.isArray(
                d.detail
            )
        ) {
            throw new Error(
                d.detail
                    .map(
                        error =>
                            error.msg ||
                            'Upload failed'
                    )
                    .join('\n')
            );
        }

        throw new Error(
            typeof d.detail ===
                'string'
                ? d.detail
                : 'Upload failed'
        );
    }

    return d;
}


// ============================================================
// INVENTORY
// ============================================================

async function inventoryPage() {
    const rows =
        await api(
            '/api/inventory'
        );

    const owner =
        ['owner', 'admin'].includes(
            me.role
        );

    $('#page').innerHTML = `
        <div class="page-head">

            <div>

                <div class="eyebrow">
                    STOCK CONTROL
                </div>

                <h1>
                    Inventory
                </h1>

                <p>
                    Thresholds are stored
                    per product and used
                    by the Inventory Agent.
                </p>

            </div>

            <button
                class="btn btn-primary"
                onclick="route('ai')"
            >
                ✦ Ask about stock
            </button>

        </div>

        <div class="card table-wrap">

            <table class="table">

                <thead>
                    <tr>
                        <th>Product</th>
                        <th>Stock</th>
                        <th>Threshold</th>
                        <th>Status</th>
                        ${
                            owner
                                ? '<th>Action</th>'
                                : ''
                        }
                    </tr>
                </thead>

                <tbody>

                    ${
                        rows
                            .map(x => {
                                const st =
                                    x.stock <= 0
                                        ? 'out'
                                        : x.low_stock
                                            ? 'low'
                                            : 'ok';

                                return `
                                <tr>

                                    <td>
                                        <b>
                                            ${esc(
                                                x.product
                                            )}
                                        </b>
                                    </td>

                                    <td>
                                        ${x.stock}
                                    </td>

                                    <td>
                                        ${x.reorder_level}
                                    </td>

                                    <td>

                                        <span
                                            class="
                                                status
                                                ${
                                                    st ===
                                                    'low'
                                                        ? 'low'
                                                        : st ===
                                                            'out'
                                                            ? 'out'
                                                            : ''
                                                }
                                            "
                                        >

                                            <span
                                                class="
                                                    stock-dot
                                                    ${
                                                        st ===
                                                        'low'
                                                            ? 'low'
                                                            : st ===
                                                                'out'
                                                                ? 'out'
                                                                : ''
                                                    }
                                                "
                                            ></span>

                                            ${
                                                st ===
                                                'out'
                                                    ? 'Out of stock'
                                                    : st ===
                                                        'low'
                                                        ? 'Low stock'
                                                        : 'In stock'
                                            }

                                        </span>

                                    </td>

                                    ${
                                        owner
                                            ? `
                                            <td>

                                                <button
                                                    class="ghost"
                                                    onclick="
                                                        stockModal(
                                                            ${x.product_id},
                                                            ${x.stock},
                                                            ${x.reorder_level}
                                                        )
                                                    "
                                                >
                                                    Update
                                                </button>

                                            </td>
                                            `
                                            : ''
                                    }

                                </tr>
                                `;
                            })
                            .join('') ||
                        `
                        <tr>
                            <td colspan="5">
                                No inventory records.
                            </td>
                        </tr>
                        `
                    }

                </tbody>

            </table>

        </div>
    `;
}


function stockModal(
    id,
    stock,
    reorder
) {
    openModal(`
        <div class="eyebrow">
            INVENTORY
        </div>

        <h2>
            Update stock
        </h2>

        <form id="stock-form">

            <div class="form-grid">

                <div class="field">

                    <label>
                        Current stock
                    </label>

                    <input
                        id="s-stock"
                        type="number"
                        min="0"
                        value="${stock}"
                    >

                </div>

                <div class="field">

                    <label>
                        Reorder level
                    </label>

                    <input
                        id="s-reorder"
                        type="number"
                        min="0"
                        value="${reorder}"
                    >

                </div>

            </div>

            <div class="form-actions">

                <button
                    type="button"
                    class="ghost"
                    onclick="closeModal()"
                >
                    Cancel
                </button>

                <button
                    class="btn btn-primary"
                >
                    Save
                </button>

            </div>

        </form>
    `);

    $('#stock-form').onsubmit =
        async e => {
            e.preventDefault();

            try {
                await api(
                    '/api/inventory/' +
                        id,
                    {
                        method: 'PATCH',
                        body:
                            new URLSearchParams(
                                {
                                    stock:
                                        $('#s-stock')
                                            .value,
                                    reorder_level:
                                        $('#s-reorder')
                                            .value
                                }
                            )
                    }
                );

                closeModal();

                toast(
                    'Inventory updated'
                );

                inventoryPage();

            } catch (err) {
                toast(
                    err.message,
                    'error'
                );
            }
        };
}


// ============================================================
// ORDERS
// ============================================================

async function ordersPage() {
    try {
        const os = await api('/api/orders');

        const isCustomer = me.role === 'customer';
        const canManage = ['owner', 'admin', 'staff'].includes(me.role);

        $('#page').innerHTML = `
            <div class="page-head">

                <div>
                    <div class="eyebrow">
                        ${isCustomer ? 'YOUR SHOPPING' : 'ORDER MANAGEMENT'}
                    </div>

                    <h1>
                        ${isCustomer ? 'My Orders' : 'Orders'}
                    </h1>

                    <p>
                        ${
                            isCustomer
                                ? 'Track your products, order status and expected delivery.'
                                : 'View customer orders and manage delivery progress.'
                        }
                    </p>
                </div>

                ${
                    isCustomer
                        ? `
                        <button
                            class="btn btn-primary"
                            onclick="customerStorePage()"
                        >
                            Continue Shopping
                        </button>
                        `
                        : `
                        <button
                            class="btn btn-primary"
                            onclick="route('products')"
                        >
                            + Add Product
                        </button>
                        `
                }

            </div>

            ${
                os.length
                    ? `
                    <div
                        style="
                            display:grid;
                            grid-template-columns:
                                repeat(auto-fit,minmax(330px,1fr));
                            gap:18px;
                        "
                    >

                        ${os.map(o => {

                            const statusLabel = {
                                pending: 'Order Placed',
                                confirmed: 'Confirmed',
                                processing: 'Out for Delivery',
                                shipped: 'Shipped',
                                completed: 'Delivered',
                                cancelled: 'Cancelled'
                            }[o.status] || o.status;

                            const statusClass =
                                o.status === 'cancelled'
                                    ? 'out'
                                    : o.status === 'pending'
                                        ? 'low'
                                        : '';

                            return `
                                <div
                                    class="card"
                                    style="
                                        padding:22px;
                                        border-radius:18px;
                                    "
                                >

                                    <div
                                        style="
                                            display:flex;
                                            justify-content:space-between;
                                            align-items:center;
                                            gap:12px;
                                            margin-bottom:8px;
                                        "
                                    >

                                        <div>
                                            <div class="small muted">
                                                ORDER
                                            </div>

                                            <h3 style="margin:3px 0 0">
                                                #${o.id}
                                            </h3>
                                        </div>

                                        <span class="status ${statusClass}">
                                            ${esc(statusLabel)}
                                        </span>

                                    </div>

                                    <div
                                        class="small muted"
                                        style="margin-bottom:18px"
                                    >
                                        Placed ${date(o.created_at)}
                                    </div>

                                    ${
                                        !isCustomer && o.customer
                                            ? `
                                            <div
                                                style="
                                                    background:#f4f0e7;
                                                    padding:12px;
                                                    border-radius:12px;
                                                    margin-bottom:15px;
                                                "
                                            >
                                                <div class="small muted">
                                                    CUSTOMER
                                                </div>

                                                <strong>
                                                    ${esc(
                                                        o.customer.full_name ||
                                                        'Customer'
                                                    )}
                                                </strong>

                                                ${
                                                    o.delivery_details
                                                        ? `
                                                        <div
                                                            class="small muted"
                                                            style="margin-top:5px"
                                                        >
                                                            ${esc(
                                                                o.delivery_details
                                                            )}
                                                        </div>
                                                        `
                                                        : ''
                                                }
                                            </div>
                                            `
                                            : ''
                                    }

                                    ${isCustomer ? `
                                        <div style="margin:16px 0;display:flex;gap:6px;align-items:center;flex-wrap:wrap;">
                                            ${[
                                                ['pending','Order Placed'],
                                                ['confirmed','Confirmed'],
                                                ['shipped','Shipped'],
                                                ['processing','Out for Delivery'],
                                                ['completed','Delivered']
                                            ].map(([key,label],idx) => `
                                                <span style="padding:7px 10px;border-radius:999px;background:${['pending','confirmed','shipped','processing','completed'].indexOf(o.status)>=idx ? '#e8f0ea' : '#f1eee8'};font-size:12px;">
                                                    ${label}
                                                </span>
                                                ${idx < 4 ? '<span class="muted">→</span>' : ''}
                                            `).join('')}
                                        </div>
                                    ` : ''}

                                    ${!isCustomer && o.customer ? `
                                        <div class="small" style="margin:10px 0 16px;padding:10px 12px;background:#f8f5ef;border-radius:10px;">
                                            <b>Phone:</b> ${esc(o.phone || 'Not provided')}
                                            <br>
                                            <b>Address:</b> ${esc(o.address || 'Not provided')}
                                        </div>
                                    ` : ''}

                                    <div class="small muted">
                                        PRODUCTS
                                    </div>

                                    <div
                                        style="
                                            margin-top:8px;
                                            display:grid;
                                            gap:8px;
                                        "
                                    >

                                        ${
                                            (o.items || [])
                                                .map(
                                                    i => `
                                                    <div
                                                        style="
                                                            display:flex;
                                                            justify-content:space-between;
                                                            gap:12px;
                                                            padding:10px 0;
                                                            border-bottom:1px solid #eee8dd;
                                                        "
                                                    >

                                                        <div>
                                                            <strong>
                                                                ${esc(i.product)}
                                                            </strong>

                                                            <div class="small muted">
                                                                Quantity:
                                                                ${i.quantity}
                                                            </div>
                                                        </div>

                                                        <strong>
                                                            ${money(
                                                                Number(i.unit_price) *
                                                                Number(i.quantity)
                                                            )}
                                                        </strong>

                                                    </div>
                                                    `
                                                )
                                                .join('')
                                        }

                                    </div>

                                    <div
                                        style="
                                            display:flex;
                                            justify-content:space-between;
                                            margin-top:15px;
                                            padding-top:12px;
                                            border-top:1px solid #ddd5c7;
                                        "
                                    >
                                        <strong>Total</strong>

                                        <strong>
                                            ${money(o.total_amount)}
                                        </strong>
                                    </div>

                                    ${
                                        o.expected_delivery_date
                                            ? `
                                            <div
                                                style="
                                                    margin-top:15px;
                                                    padding:12px;
                                                    background:#e8f0ea;
                                                    border-radius:12px;
                                                "
                                            >
                                                <div class="small muted">
                                                    EXPECTED DELIVERY
                                                </div>

                                                <strong>
                                                    ${esc(
                                                        o.expected_delivery_date
                                                    )}
                                                </strong>
                                            </div>
                                            `
                                            : `
                                            ${
                                                isCustomer
                                                    ? `
                                                    <div
                                                        style="
                                                            margin-top:15px;
                                                            padding:12px;
                                                            background:#f5f1e8;
                                                            border-radius:12px;
                                                        "
                                                    >
                                                        <div class="small muted">
                                                            EXPECTED DELIVERY
                                                        </div>

                                                        <span>
                                                            Owner has not set a delivery date yet.
                                                        </span>
                                                    </div>
                                                    `
                                                    : ''
                                            }
                                            `
                                    }

                                    ${
                                        canManage
                                            ? `
                                            <div
                                                style="
                                                    margin-top:18px;
                                                    padding-top:15px;
                                                    border-top:1px solid #eee8dd;
                                                "
                                            >

                                                <div class="small muted">
                                                    UPDATE ORDER
                                                </div>

                                                <div
                                                    style="
                                                        display:grid;
                                                        grid-template-columns:
                                                            minmax(0,1fr)
                                                            minmax(0,1fr);
                                                        gap:10px;
                                                        margin-top:8px;
                                                    "
                                                >

                                                    <select
                                                        id="order-status-${o.id}"
                                                        class="field input"
                                                    >
                                                        <option
                                                            value="pending"
                                                            ${o.status === 'pending' ? 'selected' : ''}
                                                        >
                                                            Order Placed
                                                        </option>

                                                        <option
                                                            value="confirmed"
                                                            ${o.status === 'confirmed' ? 'selected' : ''}
                                                        >
                                                            Confirmed
                                                        </option>

                                                        <option
                                                            value="processing"
                                                            ${o.status === 'processing' ? 'selected' : ''}
                                                        >
                                                            Processing
                                                        </option>

                                                        <option
                                                            value="shipped"
                                                            ${o.status === 'shipped' ? 'selected' : ''}
                                                        >
                                                            Shipped
                                                        </option>

                                                        <option
                                                            value="completed"
                                                            ${o.status === 'completed' ? 'selected' : ''}
                                                        >
                                                            Delivered
                                                        </option>

                                                        <option
                                                            value="cancelled"
                                                            ${o.status === 'cancelled' ? 'selected' : ''}
                                                        >
                                                            Cancelled
                                                        </option>
                                                    </select>

                                                    <input
                                                        id="order-date-${o.id}"
                                                        type="date"
                                                        value="${
                                                            o.expected_delivery_date
                                                                ? String(
                                                                    o.expected_delivery_date
                                                                ).slice(0,10)
                                                                : ''
                                                        }"
                                                    >

                                                </div>

                                                <button
                                                    class="btn btn-primary btn-full"
                                                    style="margin-top:10px"
                                                    onclick="
                                                        saveOrderUpdate(
                                                            ${o.id}
                                                        )
                                                    "
                                                >
                                                    Save Order Update
                                                </button>

                                            </div>
                                            `
                                            : ''
                                    }

                                </div>
                            `;
                        }).join('')}

                    </div>
                    `
                    : `
                    <div class="card empty">
                        ${
                            isCustomer
                                ? 'You have not placed any orders yet.'
                                : 'No customer orders have been placed yet.'
                        }
                    </div>
                    `
            }
        `;

    } catch (e) {
        $('#page').innerHTML = `
            <div class="card">
                <div class="error">
                    ${esc(e.message)}
                </div>
            </div>
        `;
    }
}


async function saveOrderUpdate(id) {
    try {
        const status =
            document.querySelector(
                `#order-status-${id}`
            )?.value;

        const expected_delivery_date =
            document.querySelector(
                `#order-date-${id}`
            )?.value || null;

        await api(
            '/api/orders/' +
                id +
                '/status',
            {
                method: 'PATCH',
                body: {
                    status,
                    expected_delivery_date
                }
            }
        );

        toast(
            'Order updated successfully'
        );

        ordersPage();

    } catch (e) {
        toast(
            e.message,
            'error'
        );
    }
}


// ============================================================
// CUSTOMER ORDER
// ============================================================

function orderModal(pid) {
    const p =
        productsCache.find(
            x => x.id === pid
        );

    if (!p) return;

    openModal(`
        <div class="eyebrow">
            CUSTOMER ORDER
        </div>

        <h2>
            ${esc(p.name)}
        </h2>

        <p>
            ${esc(
                p.description || ''
            )}
        </p>

        <div class="field">

            <label>
                Quantity
            </label>

            <input
                id="o-qty"
                type="number"
                min="1"
                max="${p.stock}"
                value="1"
            >

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
                onclick="placeOrder(${p.id})"
            >
                Place order ·
                ${money(p.price)}
            </button>

        </div>
    `);
}


async function placeOrder(pid) {
    try {
        const qty =
            Number(
                $('#o-qty').value
            );

        const o =
            await api(
                '/api/orders',
                {
                    method: 'POST',
                    body: {
                        items: [
                            {
                                product_id:
                                    pid,
                                quantity:
                                    qty
                            }
                        ]
                    }
                }
            );

        closeModal();

        toast(
            'Order #' +
                o.id +
                ' placed'
        );

        ordersPage();

    } catch (e) {
        toast(
            e.message,
            'error'
        );
    }
}


// ============================================================
// SUPPLIERS
// ============================================================

async function suppliersPage() {
    const xs =
        await api(
            '/api/suppliers'
        );

    const owner =
        ['owner', 'admin'].includes(
            me.role
        );

    $('#page').innerHTML = `
        <div class="page-head">

            <div>

                <div class="eyebrow">
                    SUPPLY NETWORK
                </div>

                <h1>
                    Suppliers
                </h1>

                <p>
                    Supplier records are available
                    to the Supplier Agent for
                    grounded restocking workflows.
                </p>

            </div>

            ${
                owner
                    ? `
                    <button
                        class="btn btn-primary"
                        onclick="supplierModal()"
                    >
                        + Add supplier
                    </button>
                    `
                    : ''
            }

        </div>

        <div class="grid grid-3">

            ${
                xs
                    .map(
                        s => `
                        <div class="card">

                            <div class="card-title">

                                <h3>
                                    ${esc(s.name)}
                                </h3>

                                ${
                                    owner
                                        ? `
                                        <button
                                            class="ghost"
                                            onclick='supplierModal(${JSON.stringify(
                                                s
                                            )})'
                                        >
                                            Edit
                                        </button>
                                        `
                                        : ''
                                }

                            </div>

                            <div class="small muted">
                                ${esc(
                                    s.contact_name ||
                                    'No contact name'
                                )}
                            </div>

                            <p class="small">

                                ${esc(
                                    s.email ||
                                    'No email'
                                )}

                                <br>

                                ${esc(
                                    s.phone ||
                                    'No phone'
                                )}

                                <br>

                                ${esc(
                                    s.address ||
                                    'No address'
                                )}

                            </p>

                            ${
                                owner
                                    ? `
                                    <button
                                        class="ghost danger"
                                        onclick="
                                            deleteSupplier(
                                                ${s.id}
                                            )
                                        "
                                    >
                                        Delete supplier
                                    </button>
                                    `
                                    : ''
                            }

                        </div>
                        `
                    )
                    .join('') ||
                `
                <div
                    class="empty"
                    style="grid-column:1/-1"
                >
                    No suppliers yet.
                </div>
                `
            }

        </div>
    `;
}


function supplierModal(
    s = null
) {
    openModal(`
        <div class="eyebrow">
            SUPPLIER NETWORK
        </div>

        <h2>
            ${s ? 'Edit supplier' : 'Add supplier'}
        </h2>

        <form id="supplier-form">

            <div class="form-grid">

                <div class="field full">

                    <label>
                        Name
                    </label>

                    <input
                        id="sp-name"
                        value="${esc(
                            s?.name || ''
                        )}"
                        required
                    >

                </div>

                <div class="field">

                    <label>
                        Contact name
                    </label>

                    <input
                        id="sp-contact"
                        value="${esc(
                            s?.contact_name ||
                            ''
                        )}"
                    >

                </div>

                <div class="field">

                    <label>
                        Email
                    </label>

                    <input
                        id="sp-email"
                        type="email"
                        value="${esc(
                            s?.email || ''
                        )}"
                    >

                </div>

                <div class="field">

                    <label>
                        Phone
                    </label>

                    <input
                        id="sp-phone"
                        value="${esc(
                            s?.phone || ''
                        )}"
                    >

                </div>

                <div class="field">

                    <label>
                        Address
                    </label>

                    <input
                        id="sp-address"
                        value="${esc(
                            s?.address || ''
                        )}"
                    >

                </div>

            </div>

            <div class="form-actions">

                <button
                    type="button"
                    class="ghost"
                    onclick="closeModal()"
                >
                    Cancel
                </button>

                <button
                    class="btn btn-primary"
                >
                    Save supplier
                </button>

            </div>

        </form>
    `);

    $('#supplier-form').onsubmit =
        async e => {
            e.preventDefault();

            const body = {
                name:
                    $('#sp-name').value,
                contact_name:
                    $('#sp-contact').value ||
                    null,
                email:
                    $('#sp-email').value ||
                    null,
                phone:
                    $('#sp-phone').value ||
                    null,
                address:
                    $('#sp-address').value ||
                    null
            };

            try {
                await api(
                    s
                        ? '/api/suppliers/' +
                              s.id
                        : '/api/suppliers',
                    {
                        method: s
                            ? 'PATCH'
                            : 'POST',
                        body
                    }
                );

                closeModal();

                toast(
                    'Supplier saved'
                );

                suppliersPage();

            } catch (err) {
                toast(
                    err.message,
                    'error'
                );
            }
        };
}


async function deleteSupplier(id) {
    if (
        !confirm(
            'Delete this supplier?'
        )
    ) {
        return;
    }

    try {
        await api(
            '/api/suppliers/' + id,
            {
                method: 'DELETE'
            }
        );

        toast(
            'Supplier deleted'
        );

        suppliersPage();

    } catch (e) {
        toast(
            e.message,
            'error'
        );
    }
}


// ============================================================
// ANALYTICS
// ============================================================

async function analyticsPage() {
    const a =
        await api(
            '/api/insights/analytics'
        );

    $('#page').innerHTML = `
        <div class="page-head">

            <div>

                <div class="eyebrow">
                    BUSINESS INTELLIGENCE
                </div>

                <h1>
                    Analytics
                </h1>

                <p>
                    Live calculations from
                    orders, inventory and products.
                </p>

            </div>

            <button
                class="btn btn-primary"
                onclick="
                    aiPrompt(
                        'Analyze our recent business performance and identify useful observations.'
                    )
                "
            >
                ✦ Ask AURA to analyze
            </button>

        </div>

        <div class="grid grid-4">

            <div class="card metric">

                <div class="metric-label">
                    Revenue
                </div>

                <div class="metric-value">
                    ${money(a.revenue)}
                </div>

            </div>

            <div class="card metric">

                <div class="metric-label">
                    Active orders
                </div>

                <div class="metric-value">
                    ${a.pending_orders}
                </div>

            </div>

            <div class="card metric">

                <div class="metric-label">
                    Low stock
                </div>

                <div class="metric-value">
                    ${a.low_stock}
                </div>

            </div>

            <div class="card metric">

                <div class="metric-label">
                    Out of stock
                </div>

                <div class="metric-value">
                    ${a.out_of_stock}
                </div>

            </div>

        </div>

        <div
            class="grid grid-2"
            style="margin-top:15px"
        >

            <div class="card">

                <div class="card-title">
                    <h3>
                        Revenue trend · 7 days
                    </h3>
                </div>

                ${revenueChart(
                    a.daily_revenue
                )}

            </div>

            <div class="card">

                <div class="card-title">
                    <h3>
                        Order status
                    </h3>
                </div>

                ${statusChart(
                    a.order_statuses
                )}

            </div>

        </div>

        <div
            class="card"
            style="margin-top:15px"
        >

            <div class="card-title">

                <h3>
                    Product performance
                </h3>

                <span class="small muted">
                    Units sold
                </span>

            </div>

            ${
                a.top_products.length
                    ? a.top_products
                          .map(
                              (x, i) => `
                              <div
                                  class="activity-row"
                              >

                                  <div
                                      class="activity-icon"
                                  >
                                      ${i + 1}
                                  </div>

                                  <div>

                                      <b>
                                          ${esc(
                                              x.name
                                          )}
                                      </b>

                                      <small>
                                          Actual order quantity
                                      </small>

                                  </div>

                                  <strong>
                                      ${x.units}
                                  </strong>

                              </div>
                              `
                          )
                          .join('')
                    : `
                    <div class="empty">
                        No completed/non-cancelled
                        sales data yet.
                    </div>
                    `
            }

        </div>
    `;
}


function statusChart(xs) {
    const max = Math.max(
        ...xs.map(x => x.count),
        1
    );

    return `
        <div
            style="
                display:grid;
                gap:12px;
                padding:10px 0
            "
        >

            ${
                xs
                    .map(
                        x => `
                        <div>

                            <div
                                style="
                                    display:flex;
                                    justify-content:space-between;
                                    font-size:10px;
                                    margin-bottom:5px
                                "
                            >

                                <span>
                                    ${esc(
                                        x.status
                                    )}
                                </span>

                                <b>
                                    ${x.count}
                                </b>

                            </div>

                            <div
                                style="
                                    height:8px;
                                    background:#eee8dd;
                                    border-radius:20px
                                "
                            >

                                <div
                                    style="
                                        height:100%;
                                        width:${x.count /
                                        max *
                                        100}%;
                                        background:${
                                            x.status ===
                                            'cancelled'
                                                ? '#a95042'
                                                : '#173c32'
                                        };
                                        border-radius:20px
                                    "
                                ></div>

                            </div>

                        </div>
                        `
                    )
                    .join('') ||
                `
                <div class="empty">
                    No order data.
                </div>
                `
            }

        </div>
    `;
}


// ============================================================
// AI
// ============================================================

async function aiPage() {
    const suggestions = [
        'Which products need restocking?',
        'Show me today’s order situation.',
        'Prepare a supplier request for low-stock products.',
        'According to our return policy, can this order be returned?'
    ];

    $('#page').innerHTML = `
        <div class="page-head">

            <div>

                <div class="eyebrow">
                    REAL AGENTIC AI
                </div>

                <h1>
                    AI Command Center
                </h1>

                <p>
                    Ask naturally. AURA routes
                    specialist agents, calls real
                    tools, evaluates evidence and
                    grounds the final result.
                </p>

            </div>

            <span class="status">
                GROUNDED MODE
            </span>

        </div>

        <div class="ai-shell">

            <section class="card ai-composer">

                <div class="card-title">

                    <h3>
                        What should AURA work on?
                    </h3>

                    <span class="small muted">
                        Groq · live
                    </span>

                </div>

                <div class="ai-suggestions">

                    ${suggestions
                        .map(
                            x => `
                            <button
                                class="suggestion"
                                onclick="
                                    fillAI(
                                        ${JSON.stringify(x)}
                                    )
                                "
                            >
                                ${esc(x)}
                            </button>
                            `
                        )
                        .join('')}

                </div>

                <div
                    class="field"
                    style="flex:1"
                >

                    <label>
                        Business request
                    </label>

                    <textarea
                        id="ai-message"
                        placeholder="
                            Ask about your products,
                            orders, inventory, suppliers,
                            analytics or business knowledge...
                        "
                    ></textarea>

                </div>

                <div class="form-actions">

                    <button
                        class="btn btn-primary"
                        id="ai-run"
                        onclick="runAI()"
                    >
                        ✦ Run with AURA
                    </button>

                </div>

                <div id="ai-result"></div>

            </section>

            <aside class="card">

                <div class="card-title">

                    <h3>
                        Live activity
                    </h3>

                    <button
                        class="ghost"
                        onclick="route('activity')"
                    >
                        Open log
                    </button>

                </div>

                <div
                    id="ai-live"
                    class="activity-list"
                >
                    Loading…
                </div>

            </aside>

        </div>
    `;

    loadRecentActivity(
        '#ai-live'
    );
}


function fillAI(x) {
    $('#ai-message').value = x;
    $('#ai-message').focus();
}


function aiPrompt(x) {
    route('ai');

    setTimeout(
        () => {
            fillAI(x);
        },
        50
    );
}


async function runAI() {
    const msg =
        $('#ai-message')
            .value
            .trim();

    if (!msg) {
        return toast(
            'Enter a request first',
            'error'
        );
    }

    const btn =
        $('#ai-run');

    btn.disabled = true;

    btn.textContent =
        'AURA is working…';

    $('#ai-result').innerHTML = `
        <div class="top-note">
            Manager is coordinating
            specialist agents. The UI will
            reflect the actual execution
            returned by the backend.
        </div>
    `;

    try {
        const r =
            await api(
                '/api/ai/chat',
                {
                    method: 'POST',
                    body: {
                        message: msg
                    }
                }
            );

        $('#ai-result').innerHTML =
            aiResult(r);

        loadRecentActivity(
            '#ai-live'
        );

    } catch (e) {
        $('#ai-result').innerHTML = `
            <div
                class="error"
                style="margin-top:15px"
            >
                ${esc(e.message)}
            </div>
        `;

    } finally {
        btn.disabled = false;

        btn.textContent =
            '✦ Run with AURA';
    }
}


function aiResult(r) {
    const steps = [
        {
            agent: 'Manager Agent',
            text: 'Orchestrated request',
            state: 'complete'
        },

        ...(r.agents || []).map(
            a => ({
                agent:
                    (
                        a.agent ||
                        'Specialist'
                    ).replaceAll(
                        '_',
                        ' '
                    ),
                text:
                    a.answer ||
                    'Evidence gathered',
                state: 'complete'
            })
        ),

        ...(r.approval_id
            ? [
                  {
                      agent:
                          'Human Approval',
                      text:
                          'Action is pending owner/admin approval',
                      state:
                          'pending'
                  }
              ]
            : [])
    ];

    let sources = [];

    (r.agents || [])
        .forEach(
            a =>
                (a.evidence || [])
                    .forEach(
                        e => {
                            if (
                                e.result
                                    ?.sources
                            ) {
                                sources.push(
                                    ...e
                                        .result
                                        .sources
                                );
                            }
                        }
                    )
        );

    return `
        <div class="ai-result">

            <div class="card-title">

                <h3>
                    Grounded result
                </h3>

                ${
                    r.approval_id
                        ? `
                        <span class="status low">
                            PENDING APPROVAL
                        </span>
                        `
                        : `
                        <span class="status">
                            COMPLETE
                        </span>
                        `
                }

            </div>

            <div class="answer-box">
                ${formatAnswer(
                    r.answer
                )}
            </div>

            ${
                steps.length
                    ? `
                    <div
                        style="
                            margin-top:18px
                        "
                    >

                        <div
                            class="small muted"
                            style="
                                margin-bottom:8px
                            "
                        >
                            Actual workflow
                        </div>

                        <div class="trace">

                            ${steps
                                .map(
                                    (s, i) => `
                                    <div
                                        class="trace-step"
                                    >

                                        <b>
                                            ${i + 1}.
                                            ${esc(
                                                s.agent
                                            )}
                                        </b>

                                        <small>
                                            ${esc(
                                                s.text
                                            )}
                                            ·
                                            ${s.state}
                                        </small>

                                    </div>
                                    `
                                )
                                .join('')}

                        </div>

                    </div>
                    `
                    : ''
            }

            ${
                sources.length
                    ? `
                    <div class="evidence">

                        <b class="small">
                            Sources used
                        </b>

                        <div>

                            ${sources
                                .map(
                                    s => `
                                    <span
                                        class="source-chip"
                                    >
                                        ${esc(
                                            s.document ||
                                            'Business document'
                                        )}

                                        ${
                                            s.page
                                                ? ` · p.${s.page}`
                                                : ''
                                        }
                                    </span>
                                    `
                                )
                                .join('')}

                        </div>

                    </div>
                    `
                    : ''
            }

            ${
                r.approval_id
                    ? `
                    <div
                        class="top-note"
                        style="margin-top:12px"
                    >
                        Approval #${
                            r.approval_id
                        }
                        is recorded.
                        No sensitive action is
                        executed until an
                        authorized approver
                        resolves it.
                    </div>
                    `
                    : ''
            }

            <details
                style="margin-top:15px"
            >

                <summary class="small">
                    Evidence & agent findings
                </summary>

                <pre
                    style="
                        white-space:pre-wrap;
                        font-size:9px;
                        max-height:300px;
                        overflow:auto
                    "
                >${esc(
                    JSON.stringify(
                        {
                            plan:
                                r.plan,
                            evaluation:
                                r.evaluation,
                            agents:
                                r.agents
                        },
                        null,
                        2
                    )
                )}</pre>

            </details>

        </div>
    `;
}


function formatAnswer(x) {
    return esc(
        x ||
            'No answer returned.'
    )
        .replace(
            /\*\*(.*?)\*\*/g,
            '<strong>$1</strong>'
        )
        .replace(
            /\n/g,
            '<br>'
        );
}


// ============================================================
// ACTIVITY
// ============================================================

async function activityPage() {
    const xs =
        await api(
            '/api/ai/activity'
        );

    $('#page').innerHTML = `
        <div class="page-head">

            <div>

                <div class="eyebrow">
                    OBSERVABILITY
                </div>

                <h1>
                    Agent Activity
                </h1>

                <p>
                    Real agent events recorded
                    by the Phase 2 orchestration layer.
                </p>

            </div>

        </div>

        <div class="card table-wrap">

            <table class="table">

                <thead>

                    <tr>
                        <th>Agent</th>
                        <th>Event</th>
                        <th>Tool</th>
                        <th>Timestamp</th>
                    </tr>

                </thead>

                <tbody>

                    ${
                        xs
                            .map(
                                x => `
                                <tr>

                                    <td>
                                        <b>
                                            ${esc(
                                                x.agent
                                            )}
                                        </b>
                                    </td>

                                    <td>
                                        ${esc(
                                            x.event
                                        )}
                                    </td>

                                    <td>
                                        ${esc(
                                            x.tool ||
                                            '—'
                                        )}
                                    </td>

                                    <td>
                                        ${date(
                                            x.created_at
                                        )}
                                    </td>

                                </tr>
                                `
                            )
                            .join('') ||
                        `
                        <tr>
                            <td colspan="4">
                                No agent activity yet.
                            </td>
                        </tr>
                        `
                    }

                </tbody>

            </table>

        </div>
    `;
}


async function loadRecentActivity(
    target
) {
    try {
        const xs =
            await api(
                '/api/ai/activity'
            );

        $(target).innerHTML =
            xs
                .slice(0, 7)
                .map(
                    x => `
                    <div
                        class="activity-row"
                    >

                        <div
                            class="activity-icon"
                        >
                            ✦
                        </div>

                        <div>

                            <b>
                                ${esc(
                                    x.agent
                                )}
                            </b>

                            <small>
                                ${esc(
                                    x.event
                                )}

                                ${
                                    x.tool
                                        ? ' · ' +
                                          esc(
                                              x.tool
                                          )
                                        : ''
                                }
                            </small>

                        </div>

                        <time>
                            ${new Date(
                                x.created_at
                            ).toLocaleTimeString(
                                [],
                                {
                                    hour:
                                        '2-digit',
                                    minute:
                                        '2-digit'
                                }
                            )}
                        </time>

                    </div>
                    `
                )
                .join('') ||
            `
            <div class="empty">
                No AI activity yet.
            </div>
            `;

    } catch (e) {
        $(target).textContent =
            'Activity unavailable.';
    }
}


// ============================================================
// KNOWLEDGE BASE
// ============================================================

async function knowledgePage() {
    if (
        !['owner', 'admin'].includes(
            me.role
        )
    ) {
        return unauthorized(
            'Knowledge Base'
        );
    }

    const xs =
        await api(
            '/api/knowledge'
        );

    $('#page').innerHTML = `
        <div class="page-head">

            <div>

                <div class="eyebrow">
                    BUSINESS KNOWLEDGE
                </div>

                <h1>
                    Knowledge Base
                </h1>

                <p>
                    Admin-only documents that
                    become searchable RAG context
                    for AURA.
                </p>

            </div>

            <button
                class="btn btn-primary"
                onclick="knowledgeUpload()"
            >
                + Upload document
            </button>

        </div>

        <div class="grid grid-3">

            ${
                xs
                    .map(
                        d => `
                        <div class="card">

                            <div class="card-title">

                                <h3>
                                    ${esc(
                                        d.name
                                    )}
                                </h3>

                                <span
                                    class="
                                        status
                                        ${
                                            d.status !==
                                            'indexed'
                                                ? 'low'
                                                : ''
                                        }
                                    "
                                >
                                    ${esc(
                                        d.status
                                    )}
                                </span>

                            </div>

                            <div
                                class="small muted"
                            >
                                Version
                                ${d.version}
                                ·
                                ${d.chunks}
                                chunks
                                ·
                                ${date(
                                    d.created_at
                                )}
                            </div>

                            <div
                                class="approval-meta"
                            >

                                <span>
                                    ${esc(
                                        d.mime_type
                                    )}
                                </span>

                                <span>
                                    ${Math.round(
                                        d.size /
                                            1024
                                    )}
                                    KB
                                </span>

                            </div>

                            <div
                                class="product-actions"
                            >

                                <button
                                    class="ghost"
                                    onclick="
                                        replaceKnowledge(
                                            ${d.id}
                                        )
                                    "
                                >
                                    Replace
                                </button>

                                <button
                                    class="ghost"
                                    onclick="
                                        reindexKnowledge(
                                            ${d.id}
                                        )
                                    "
                                >
                                    Re-index
                                </button>

                                <button
                                    class="ghost danger"
                                    onclick="
                                        deleteKnowledge(
                                            ${d.id}
                                        )
                                    "
                                >
                                    Delete
                                </button>

                            </div>

                        </div>
                        `
                    )
                    .join('') ||
                `
                <div
                    class="empty"
                    style="grid-column:1/-1"
                >
                    No documents yet.
                    Upload your first policy,
                    guide or business document.
                </div>
                `
            }

        </div>
    `;
}


function knowledgeUpload() {
    openModal(`
        <div class="eyebrow">
            RAG INGESTION
        </div>

        <h2>
            Upload business knowledge
        </h2>

        <p class="muted small">
            PDF, DOCX or TXT · max 20 MB.
            The backend extracts, chunks,
            embeds and stores vectors in the
            business-scoped index.
        </p>

        <form id="knowledge-form">

            <div class="field">

                <label>
                    Document
                </label>

                <input
                    id="knowledge-file"
                    type="file"
                    accept="
                        application/pdf,
                        .pdf,
                        .docx,
                        .txt,
                        text/plain
                    "
                    required
                >

            </div>

            <div class="form-actions">

                <button
                    class="btn btn-primary"
                >
                    Upload & index
                </button>

            </div>

        </form>
    `);

    $('#knowledge-form').onsubmit =
        async e => {
            e.preventDefault();

            const fd =
                new FormData();

            fd.append(
                'file',
                $('#knowledge-file')
                    .files[0]
            );

            try {
                const d =
                    await uploadForm(
                        '/api/knowledge',
                        fd
                    );

                closeModal();

                toast(
                    `Indexed ${d.chunks} chunks`
                );

                knowledgePage();

            } catch (err) {
                toast(
                    err.message,
                    'error'
                );
            }
        };
}


async function replaceKnowledge(id) {
    openModal(`
        <div class="eyebrow">
            VERSION UPDATE
        </div>

        <h2>
            Replace document
        </h2>

        <form id="replace-form">

            <div class="field">

                <label>
                    New document
                </label>

                <input
                    id="replace-file"
                    type="file"
                    accept="
                        application/pdf,
                        .pdf,
                        .docx,
                        .txt,
                        text/plain
                    "
                    required
                >

            </div>

            <div class="form-actions">

                <button
                    class="btn btn-primary"
                >
                    Replace & re-index
                </button>

            </div>

        </form>
    `);

    $('#replace-form').onsubmit =
        async e => {
            e.preventDefault();

            const fd =
                new FormData();

            fd.append(
                'file',
                $('#replace-file')
                    .files[0]
            );

            try {
                const d =
                    await uploadForm(
                        '/api/knowledge/' +
                            id +
                            '/replace',
                        fd
                    );

                closeModal();

                toast(
                    `Document updated to version ${d.version}`
                );

                knowledgePage();

            } catch (err) {
                toast(
                    err.message,
                    'error'
                );
            }
        };
}


async function reindexKnowledge(id) {
    try {
        const d =
            await api(
                '/api/knowledge/' +
                    id +
                    '/reindex',
                {
                    method: 'POST'
                }
            );

        toast(
            `Re-indexed ${d.chunks} chunks`
        );

        knowledgePage();

    } catch (e) {
        toast(
            e.message,
            'error'
        );
    }
}


async function deleteKnowledge(id) {
    if (
        !confirm(
            'Delete this document and its vectors?'
        )
    ) {
        return;
    }

    try {
        await api(
            '/api/knowledge/' +
                id,
            {
                method: 'DELETE'
            }
        );

        toast(
            'Document deleted'
        );

        knowledgePage();

    } catch (e) {
        toast(
            e.message,
            'error'
        );
    }
}


// ============================================================
// APPROVALS
// ============================================================

async function approvalsPage() {
    if (
        !['owner', 'admin'].includes(
            me.role
        )
    ) {
        return unauthorized(
            'Approval Center'
        );
    }

    const xs =
        await api(
            '/api/ai/approvals'
        );

    $('#page').innerHTML = `
        <div class="page-head">

            <div>

                <div class="eyebrow">
                    HUMAN IN THE LOOP
                </div>

                <h1>
                    Approval Center
                </h1>

                <p>
                    Sensitive AI-proposed actions
                    wait here until an authorized
                    person decides.
                </p>

            </div>

        </div>

        ${
            xs
                .map(
                    a => `
                    <div
                        class="approval-card-ui"
                    >

                        <h3>
                            ${esc(
                                a.action
                            ).replaceAll(
                                '_',
                                ' '
                            )}
                        </h3>

                        <div
                            class="approval-meta"
                        >

                            <span>
                                Status ·
                                ${esc(
                                    a.status
                                )}
                            </span>

                            <span>
                                Requested by ·
                                ${a.requested_by}
                            </span>

                            <span>
                                ${date(
                                    a.created_at
                                )}
                            </span>

                        </div>

                        <p class="small muted">
                            ${esc(
                                a.details ||
                                'No details supplied.'
                            )}
                        </p>

                        ${
                            a.status ===
                            'pending'
                                ? `
                                <div
                                    class="approval-actions"
                                >

                                    <button
                                        class="btn btn-primary"
                                        onclick="
                                            resolveApproval(
                                                ${a.id},
                                                true
                                            )
                                        "
                                    >
                                        Approve & execute
                                    </button>

                                    <button
                                        class="ghost danger"
                                        onclick="
                                            resolveApproval(
                                                ${a.id},
                                                false
                                            )
                                        "
                                    >
                                        Reject
                                    </button>

                                </div>
                                `
                                : `
                                <div class="small muted">
                                    Resolved
                                    ${date(
                                        a.resolved_at
                                    )}
                                    ${
                                        a.approved_by
                                            ? ' · by user #' +
                                              a.approved_by
                                            : ''
                                    }
                                </div>
                                `
                        }

                    </div>
                    `
                )
                .join('') ||
            `
            <div class="empty">
                No approval requests.
            </div>
            `
        }
    `;
}


async function resolveApproval(
    id,
    approve
) {
    try {
        await api(
            '/api/ai/approvals/' +
                id +
                '/' +
                (
                    approve
                        ? 'approve'
                        : 'reject'
                ),
            {
                method: 'POST'
            }
        );

        toast(
            approve
                ? 'Approved action executed safely.'
                : 'Approval rejected.'
        );

        approvalsPage();

    } catch (e) {
        toast(
            e.message,
            'error'
        );
    }
}


// ============================================================
// SECURITY
// ============================================================

async function securityPage() {
    if (
        !['owner', 'admin'].includes(
            me.role
        )
    ) {
        return unauthorized(
            'Security & Audit'
        );
    }

    const xs =
        await api(
            '/api/insights/audit'
        );

    $('#page').innerHTML = `
        <div class="page-head">

            <div>

                <div class="eyebrow">
                    CONTROL & TRACEABILITY
                </div>

                <h1>
                    Security & Audit
                </h1>

                <p>
                    Business-scoped audit events.
                    Secrets and passwords are never
                    displayed here.
                </p>

            </div>

        </div>

        <div class="card table-wrap">

            <table class="table">

                <thead>

                    <tr>
                        <th>Action</th>
                        <th>Entity</th>
                        <th>User</th>
                        <th>Details</th>
                        <th>Time</th>
                    </tr>

                </thead>

                <tbody>

                    ${
                        xs
                            .map(
                                x => `
                                <tr>

                                    <td>
                                        <b>
                                            ${esc(
                                                x.action
                                            )}
                                        </b>
                                    </td>

                                    <td>
                                        ${esc(
                                            x.entity_type ||
                                            '—'
                                        )}

                                        ${
                                            x.entity_id
                                                ? '#' +
                                                  x.entity_id
                                                : ''
                                        }
                                    </td>

                                    <td>
                                        #${x.user_id}
                                    </td>

                                    <td>
                                        ${esc(
                                            x.details ||
                                            '—'
                                        )}
                                    </td>

                                    <td>
                                        ${date(
                                            x.created_at
                                        )}
                                    </td>

                                </tr>
                                `
                            )
                            .join('') ||
                        `
                        <tr>
                            <td colspan="5">
                                No audit events yet.
                            </td>
                        </tr>
                        `
                    }

                </tbody>

            </table>

        </div>
    `;
}


// ============================================================
// SETTINGS
// ============================================================

async function settingsPage() {
    if (
        !['owner', 'admin'].includes(
            me.role
        )
    ) {
        return unauthorized(
            'Business Settings'
        );
    }

    const staff =
        await api(
            '/api/business/staff'
        );

    $('#page').innerHTML = `
        <div class="page-head">

            <div>

                <div class="eyebrow">
                    BUSINESS CONTROL
                </div>

                <h1>
                    Settings
                </h1>

                <p>
                    Change the business context
                    used throughout AURA—no
                    source-code edits required.
                </p>

            </div>

        </div>

        <div class="grid grid-2">

            <div class="card">

                <div class="card-title">
                    <h3>
                        Business profile
                    </h3>
                </div>

                <form id="biz-form">

                    <div class="form-grid">

                        <div class="field full">

                            <label>
                                Business name
                            </label>

                            <input
                                id="b-name"
                                value="${esc(
                                    biz.name
                                )}"
                                required
                            >

                        </div>

                        <div class="field full">

                            <label>
                                Description
                            </label>

                            <textarea
                                id="b-desc"
                                rows="3"
                            >${esc(
                                biz.description ||
                                ''
                            )}</textarea>

                        </div>

                        <div class="field">

                            <label>
                                Contact email
                            </label>

                            <input
                                id="b-email"
                                type="email"
                                value="${esc(
                                    biz.contact_email ||
                                    ''
                                )}"
                            >

                        </div>

                        <div class="field">

                            <label>
                                Phone
                            </label>

                            <input
                                id="b-phone"
                                value="${esc(
                                    biz.contact_phone ||
                                    ''
                                )}"
                            >

                        </div>

                        <div class="field full">

                            <label>
                                Address
                            </label>

                            <input
                                id="b-address"
                                value="${esc(
                                    biz.address ||
                                    ''
                                )}"
                            >

                        </div>

                        <div class="field">

                            <label>
                                Currency
                            </label>

                            <input
                                id="b-currency"
                                value="${esc(
                                    biz.currency
                                )}"
                                maxlength="10"
                            >

                        </div>

                    </div>

                    <div class="form-actions">

                        <button
                            class="btn btn-primary"
                        >
                            Save profile
                        </button>

                    </div>

                </form>

            </div>

            <div class="card">

                <div class="card-title">
                    <h3>
                        Operational policy
                    </h3>
                </div>

                <form id="settings-form">

                    <div class="field">

                        <label>
                            Policies
                        </label>

                        <textarea
                            id="b-policy"
                            rows="5"
                        >${esc(
                            biz.policies ||
                            ''
                        )}</textarea>

                    </div>

                    <div
                        class="field"
                        style="margin-top:12px"
                    >

                        <label>
                            Business hours
                        </label>

                        <textarea
                            id="b-hours"
                            rows="3"
                        >${esc(
                            biz.business_hours ||
                            ''
                        )}</textarea>

                    </div>

                    <div
                        class="field"
                        style="margin-top:12px"
                    >

                        <label>
                            Default low-stock threshold
                        </label>

                        <input
                            id="b-threshold"
                            type="number"
                            min="0"
                            value="${biz.low_stock_threshold}"
                        >

                    </div>

                    <div class="form-actions">

                        <button
                            class="btn btn-primary"
                        >
                            Save operating settings
                        </button>

                    </div>

                </form>

            </div>

        </div>

        <div
            class="grid grid-2"
            style="margin-top:15px"
        >

            <div class="card">

                <div class="card-title">

                    <h3>
                        Team
                    </h3>

                    ${
                        me.role === 'owner'
                            ? `
                            <button
                                class="ghost"
                                onclick="staffModal()"
                            >
                                + Member
                            </button>
                            `
                            : ''
                    }

                </div>

                <div class="table-wrap">

                    <table class="table">

                        <thead>

                            <tr>
                                <th>Name</th>
                                <th>Role</th>
                                <th>Active</th>
                                <th></th>
                            </tr>

                        </thead>

                        <tbody>

                            ${staff
                                .map(
                                    s => `
                                    <tr>

                                        <td>

                                            <b>
                                                ${esc(
                                                    s.full_name
                                                )}
                                            </b>

                                            <br>

                                            <span
                                                class="small muted"
                                            >
                                                ${esc(
                                                    s.email
                                                )}
                                            </span>

                                        </td>

                                        <td>
                                            ${esc(
                                                s.role
                                            )}
                                        </td>

                                        <td>
                                            ${
                                                s.is_active
                                                    ? 'Yes'
                                                    : 'No'
                                            }
                                        </td>

                                        <td>

                                            ${
                                                me.role ===
                                                    'owner' &&
                                                s.id !==
                                                    me.id
                                                    ? `
                                                    <button
                                                        class="ghost"
                                                        onclick="
                                                            toggleMember(
                                                                ${s.id},
                                                                ${!s.is_active}
                                                            )
                                                        "
                                                    >
                                                        ${
                                                            s.is_active
                                                                ? 'Deactivate'
                                                                : 'Activate'
                                                        }
                                                    </button>
                                                    `
                                                    : ''
                                            }

                                        </td>

                                    </tr>
                                    `
                                )
                                .join('')}

                        </tbody>

                    </table>

                </div>

            </div>

            <div class="card">

                <div class="card-title">

                    <h3>
                        Business logo
                    </h3>

                </div>

                <p class="small muted">
                    Used in the business identity
                    and future customer surfaces.
                </p>

                <form id="logo-form">

                    <div class="field">

                        <label>
                            Logo image
                        </label>

                        <input
                            id="logo-file"
                            type="file"
                            accept="
                                image/jpeg,
                                image/png,
                                image/webp
                            "
                            required
                        >

                    </div>

                    <div class="form-actions">

                        <button
                            class="btn btn-primary"
                        >
                            Upload logo
                        </button>

                    </div>

                </form>

            </div>

        </div>
    `;

    $('#biz-form').onsubmit =
        async e => {
            e.preventDefault();

            try {
                await api(
                    '/api/business',
                    {
                        method: 'PUT',
                        body: {
                            name:
                                $('#b-name')
                                    .value,
                            description:
                                $('#b-desc')
                                    .value ||
                                null,
                            contact_email:
                                $('#b-email')
                                    .value ||
                                null,
                            contact_phone:
                                $('#b-phone')
                                    .value ||
                                null,
                            address:
                                $('#b-address')
                                    .value ||
                                null,
                            currency:
                                $('#b-currency')
                                    .value
                        }
                    }
                );

                biz =
                    await api(
                        '/api/business'
                    );

                currency =
                    biz.currency;

                renderShell();

                toast(
                    'Business profile updated'
                );

                settingsPage();

            } catch (err) {
                toast(
                    err.message,
                    'error'
                );
            }
        };

    $('#settings-form').onsubmit =
        async e => {
            e.preventDefault();

            try {
                await api(
                    '/api/business/settings',
                    {
                        method: 'PUT',
                        body: {
                            policies:
                                $('#b-policy')
                                    .value ||
                                null,
                            business_hours:
                                $('#b-hours')
                                    .value ||
                                null,
                            low_stock_threshold:
                                Number(
                                    $(
                                        '#b-threshold'
                                    ).value
                                )
                        }
                    }
                );

                biz =
                    await api(
                        '/api/business'
                    );

                toast(
                    'Operating settings updated'
                );

            } catch (err) {
                toast(
                    err.message,
                    'error'
                );
            }
        };

    $('#logo-form').onsubmit =
        async e => {
            e.preventDefault();

            const fd =
                new FormData();

            fd.append(
                'file',
                $('#logo-file')
                    .files[0]
            );

            try {
                await uploadForm(
                    '/api/business/logo',
                    fd
                );

                toast(
                    'Logo updated'
                );

            } catch (err) {
                toast(
                    err.message,
                    'error'
                );
            }
        };
}


// ============================================================
// STAFF
// ============================================================

function staffModal() {
    openModal(`
        <div class="eyebrow">
            TEAM
        </div>

        <h2>
            Add team member
        </h2>

        <form id="staff-form">

            <div class="form-grid">

                <div class="field full">

                    <label>
                        Name
                    </label>

                    <input
                        id="t-name"
                        required
                    >

                </div>

                <div class="field full">

                    <label>
                        Email
                    </label>

                    <input
                        id="t-email"
                        type="email"
                        required
                    >

                </div>

                <div class="field">

                    <label>
                        Temporary password
                    </label>

                    <input
                        id="t-pass"
                        type="password"
                        minlength="8"
                        required
                    >

                </div>

                <div class="field">

                    <label>
                        Role
                    </label>

                    <select id="t-role">

                        <option value="staff">
                            Staff
                        </option>

                        <option value="customer">
                            Customer
                        </option>

                    </select>

                </div>

            </div>

            <div class="form-actions">

                <button
                    class="btn btn-primary"
                >
                    Create member
                </button>

            </div>

        </form>
    `);

    $('#staff-form').onsubmit =
        async e => {
            e.preventDefault();

            try {
                await api(
                    '/api/business/staff',
                    {
                        method: 'POST',
                        body: {
                            full_name:
                                $('#t-name')
                                    .value,
                            email:
                                $('#t-email')
                                    .value,
                            password:
                                $('#t-pass')
                                    .value,
                            role:
                                $('#t-role')
                                    .value
                        }
                    }
                );

                closeModal();

                toast(
                    'Member created'
                );

                settingsPage();

            } catch (err) {
                toast(
                    err.message,
                    'error'
                );
            }
        };
}


async function toggleMember(
    id,
    active
) {
    try {
        await api(
            '/api/business/staff/' +
                id +
                '?active=' +
                active,
            {
                method: 'PATCH'
            }
        );

        toast(
            active
                ? 'Member activated'
                : 'Member deactivated'
        );

        settingsPage();

    } catch (e) {
        toast(
            e.message,
            'error'
        );
    }
}


// ============================================================
// PROFILE
// ============================================================

async function profilePage() {
    biz =
        await api(
            '/api/business'
        );

    $('#page').innerHTML = `
        <div class="page-head">

            <div>

                <div class="eyebrow">
                    YOUR ACCOUNT
                </div>

                <h1>
                    Profile
                </h1>

                <p>
                    Your identity and access
                    level in this business workspace.
                </p>

            </div>

        </div>

        <div class="grid grid-2">

            <div class="card">

                <div
                    class="avatar"
                    style="
                        width:58px;
                        height:58px;
                        font-size:18px
                    "
                >
                    ${esc(
                        me.full_name
                            .split(' ')
                            .map(
                                x => x[0]
                            )
                            .slice(0, 2)
                            .join('')
                            .toUpperCase()
                    )}
                </div>

                <h2
                    style="
                        font:500 27px
                        'Playfair Display',serif;
                        margin:16px 0 4px
                    "
                >
                    ${esc(
                        me.full_name
                    )}
                </h2>

                <p class="muted small">
                    ${esc(
                        me.email
                    )}
                </p>

                <span class="status">
                    ${esc(
                        me.role
                    )}
                </span>

            </div>

            <div class="card">

                <div class="card-title">
                    <h3>
                        Access
                    </h3>
                </div>

                <p class="small">
                    Your requests, orders,
                    memories and AI conversations
                    are scoped to your authenticated
                    account and business.
                </p>

                <div class="top-note">
                    Business ·
                    ${esc(
                        biz.name
                    )}
                </div>

                <div
                    class="top-note"
                    style="margin-top:8px"
                >
                    Business data isolation ·
                    Active
                </div>

            </div>

        </div>
    `;
}


// ============================================================
// UNAUTHORIZED
// ============================================================

function unauthorized(title) {
    $('#page').innerHTML = `
        <div class="empty">

            <h2
                style="
                    font:500 28px
                    'Playfair Display',serif
                "
            >
                ${esc(title)}
            </h2>

            <p>
                You do not have permission
                to access this area.
            </p>

        </div>
    `;
}


// ============================================================
// MODAL
// ============================================================

function openModal(html) {
    $('#modal-content').innerHTML =
        html;

    $('#modal').classList.remove(
        'hidden'
    );
}


function closeModal() {
    $('#modal').classList.add(
        'hidden'
    );
}


// ============================================================
// GLOBAL EVENTS
// ============================================================

if ($('#modal-close')) {
    $('#modal-close').onclick =
        closeModal;
}

if ($('#modal .modal-backdrop')) {
    $('#modal .modal-backdrop').onclick =
        closeModal;
}


// ============================================================
// INIT
// ============================================================

async function init() {
    try {
        me =
            await api(
                '/api/auth/me'
            );

        await enter();

    } catch {
        const signup =
            new URLSearchParams(
                location.search
            ).get('auth') ===
            'signup';

        $('#app-shell').classList.add(
            'hidden'
        );

        $('#auth-screen').classList.remove(
            'hidden'
        );

        setAuthMode(
            signup
        );
    }
}


// ============================================================
// AUTH BUTTONS
// ============================================================

if ($('#signin-tab')) {
    $('#signin-tab').onclick =
        () => setAuthMode(false);
}

if ($('#signup-tab')) {
    $('#signup-tab').onclick =
        () => setAuthMode(true);
}


// ============================================================
// SIGN OUT
// ============================================================

if ($('#signout')) {
    $('#signout').onclick =
        async () => {
            try {
                await api(
                    '/api/auth/signout',
                    {
                        method: 'POST'
                    }
                );

                location.href = '/';

            } catch (e) {
                toast(
                    e.message,
                    'error'
                );
            }
        };
}


// ============================================================
// MOBILE MENU
// ============================================================

if ($('#menu-btn')) {
    $('#menu-btn').onclick =
        () => {
            $('.sidebar')
                ?.classList.add(
                    'open'
                );

            $('#scrim')
                ?.classList.add(
                    'open'
                );
        };
}

if ($('#scrim')) {
    $('#scrim').onclick =
        closeSide;
}


// ============================================================
// START APP
// ============================================================

init();
