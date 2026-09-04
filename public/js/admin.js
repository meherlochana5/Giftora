function adminGuard() {
    const u = getUser();

    if (!getToken() || !u || u.role !== 'ADMIN') {
        location.href = '/admin-login.html';
        return false;
    }

    return true;
}


/* =========================
   ADMIN NAVIGATION
   ========================= */

function renderAdminNav() {
    const e = document.getElementById('adminNav');

    if (!e) return;

    e.innerHTML = `
        <aside class="admin-nav">
            <h2>GIFTORA ADMIN</h2>

            <a href="/admin-dashboard.html">Dashboard</a>
            <a href="/admin-products.html">Products</a>
            <a href="/admin-orders.html">Orders</a>

            <a href="#" onclick="logout(); return false;">
                Logout
            </a>
        </aside>
    `;
}


/* =========================
   ADMIN MESSAGE
   ========================= */

function showAdminMessage(message, type = 'success') {

    const oldMessage =
        document.querySelector('.admin-message');

    if (oldMessage) {
        oldMessage.remove();
    }

    const messageBox =
        document.createElement('div');

    messageBox.className =
        `admin-message ${type}`;

    messageBox.textContent = message;

    document.body.appendChild(messageBox);

    setTimeout(() => {
        messageBox.classList.add('show');
    }, 10);

    setTimeout(() => {

        messageBox.classList.remove('show');

        setTimeout(() => {
            messageBox.remove();
        }, 300);

    }, 3000);
}


/* =========================
   DELETE CONFIRMATION MODAL
   ========================= */

function showDeleteModal(productId, productName) {

    const oldModal =
        document.querySelector('.admin-delete-modal');

    if (oldModal) {
        oldModal.remove();
    }

    const modal =
        document.createElement('div');

    modal.className =
        'modal-overlay admin-delete-modal';

    modal.innerHTML = `
        <div class="modal-box">

            <h2>Delete Product?</h2>

            <p>
                Are you sure you want to delete
                <b>${esc(productName)}</b>?
            </p>

            <p class="muted">
                This action cannot be undone.
            </p>

            <div class="modal-actions">

                <button
                    class="secondary"
                    onclick="this.closest('.modal-overlay').remove()">
                    Cancel
                </button>

                <button
                    class="danger"
                    onclick="confirmDeleteProduct(${productId}, this)">
                    Yes, Delete
                </button>

            </div>

        </div>
    `;

    document.body.appendChild(modal);
}


/* =========================
   DASHBOARD
   ========================= */

async function dashboard() {

    if (!adminGuard()) return;

    try {

        const d =
            await api('/admin/dashboard');

        document.getElementById('stats').innerHTML =
            Object.entries(d.stats)
                .map(([k, v]) => `
                    <div class="stat">
                        <span>
                            ${k.replaceAll('_', ' ')}
                        </span>

                        <b>${v}</b>
                    </div>
                `)
                .join('');


        document.getElementById('categoryStats').innerHTML =
            d.categoryStats
                .map(c => `
                    <div class="card">

                        <h3>
                            ${esc(c.name)}
                        </h3>

                        <p>
                            Total:
                            ${c.total_products || 0}
                        </p>

                        <p>
                            Available:
                            ${c.available_products || 0}
                        </p>

                        <p>
                            Out of stock:
                            ${c.out_of_stock_products || 0}
                        </p>

                    </div>
                `)
                .join('');


        document.getElementById('outOfStock').innerHTML =
            d.outOfStock.length
                ? `
                    <table class="table">

                        <tr>
                            <th>Product</th>
                            <th>Category</th>
                            <th>Price</th>
                            <th>Stock</th>
                        </tr>

                        ${
                            d.outOfStock
                                .map(x => `
                                    <tr>

                                        <td>
                                            ${esc(x.name)}
                                        </td>

                                        <td>
                                            ${esc(x.category_name)}
                                        </td>

                                        <td>
                                            ${money(x.price)}
                                        </td>

                                        <td>0</td>

                                    </tr>
                                `)
                                .join('')
                        }

                    </table>
                `
                : `
                    <p class="success">
                        No out-of-stock products.
                    </p>
                `;


        document.getElementById('lowStock').innerHTML =
            d.lowStock.length
                ? `
                    <table class="table">

                        <tr>
                            <th>Product</th>
                            <th>Category</th>
                            <th>Price</th>
                            <th>Stock</th>
                        </tr>

                        ${
                            d.lowStock
                                .map(x => `
                                    <tr>

                                        <td>
                                            ${esc(x.name)}
                                        </td>

                                        <td>
                                            ${esc(x.category_name)}
                                        </td>

                                        <td>
                                            ${money(x.price)}
                                        </td>

                                        <td>
                                            ${x.stock}
                                        </td>

                                    </tr>
                                `)
                                .join('')
                        }

                    </table>
                `
                : `
                    <p>
                        No low-stock products.
                    </p>
                `;

    } catch (e) {

        showAdminMessage(
            e.message || 'Unable to load dashboard.',
            'error'
        );

    }
}


/* =========================
   CATEGORY + OCCASION OPTIONS
   ========================= */

async function loadOptions() {

    try {

        const d =
            await api('/products/meta/options');

        const categorySelect =
            document.getElementById('categoryId');

        const occasionSelect =
            document.getElementById('occasionId');


        if (categorySelect) {

            categorySelect.innerHTML =
                d.categories
                    .map(c =>
                        `<option value="${c.id}">
                            ${esc(c.name)}
                        </option>`
                    )
                    .join('');
        }


        if (occasionSelect) {

            occasionSelect.innerHTML =
                '<option value="">No occasion</option>' +

                d.occasions
                    .map(o =>
                        `<option value="${o.id}">
                            ${esc(o.name)}
                        </option>`
                    )
                    .join('');
        }

    } catch (e) {

        showAdminMessage(
            e.message || 'Unable to load categories and occasions.',
            'error'
        );

    }
}


/* =========================
   LOAD ADMIN PRODUCTS
   ========================= */

async function loadAdminProducts() {

    if (!adminGuard()) return;

    try {

        const ps =
            await api('/admin/products');

        const root =
            document.getElementById('adminProducts');

        root.innerHTML = `
            <div class="card">

                <table class="table">

                    <tr>
                        <th>Image</th>
                        <th>Product</th>
                        <th>Category</th>
                        <th>Price</th>
                        <th>Stock</th>
                        <th>Actions</th>
                    </tr>

                    ${
                        ps
                            .map(p => `
                                <tr>

                                    <td>
                                        <img
                                            class="thumb"
                                            src="${esc(p.image_url)}"
                                            alt="${esc(p.name)}">
                                    </td>

                                    <td>
                                        ${esc(p.name)}
                                    </td>

                                    <td>
                                        ${esc(p.category_name)}
                                    </td>

                                    <td>
                                        ${money(p.price)}
                                    </td>

                                    <td>
                                        ${p.stock}
                                    </td>

                                    <td>

                                        <button
                                            onclick='editProduct(${JSON.stringify(p)})'>
                                            Edit
                                        </button>

                                        <button
                                            class="danger"
                                            onclick='showDeleteModal(${p.id}, ${JSON.stringify(p.name)})'>
                                            Delete
                                        </button>

                                    </td>

                                </tr>
                            `)
                            .join('')
                    }

                </table>

            </div>
        `;

    } catch (e) {

        showAdminMessage(
            e.message || 'Unable to load products.',
            'error'
        );

    }
}


/* =========================
   EDIT PRODUCT
   ========================= */

function editProduct(p) {

    document.getElementById('productId').value =
        p.id;

    document.getElementById('name').value =
        p.name;

    document.getElementById('description').value =
        p.description || '';

    document.getElementById('price').value =
        p.price;

    document.getElementById('categoryId').value =
        p.category_id;

    document.getElementById('occasionId').value =
        p.occasion_id || '';

    document.getElementById('stock').value =
        p.stock;

    document.getElementById('imageUrl').value =
        p.image_url || '';

    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}


/* =========================
   RESET PRODUCT FORM
   ========================= */

function resetProductForm() {

    const form =
        document.getElementById('productForm');

    if (form) {
        form.reset();
    }

    document.getElementById('productId').value = '';
}


/* =========================
   SAVE PRODUCT
   ========================= */

async function saveProduct(e) {

    e.preventDefault();

    if (!adminGuard()) return;


    const fd =
        new FormData();


    const fields = [
        'name',
        'description',
        'price',
        'categoryId',
        'occasionId',
        'stock',
        'imageUrl'
    ];


    fields.forEach(k => {

        const element =
            document.getElementById(k);

        fd.append(
            k,
            element ? element.value : ''
        );

    });


    const imageInput =
        document.getElementById('image');


    if (
        imageInput &&
        imageInput.files &&
        imageInput.files[0]
    ) {

        fd.append(
            'image',
            imageInput.files[0]
        );
    }


    const id =
        document.getElementById('productId').value;


    try {

        const response =
            await fetch(
                API +
                '/admin/products' +
                (id ? '/' + id : ''),
                {
                    method: id ? 'PUT' : 'POST',

                    headers: {
                        Authorization:
                            'Bearer ' + getToken()
                    },

                    body: fd
                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.message ||
                'Unable to save product.'
            );
        }


        resetProductForm();

        await loadAdminProducts();


        showAdminMessage(
            id
                ? 'Product updated successfully ✓'
                : 'Product added successfully ✓',
            'success'
        );

    } catch (e) {

        showAdminMessage(
            e.message ||
            'Unable to save product.',
            'error'
        );

    }
}


/* =========================
   DELETE PRODUCT
   ========================= */

async function confirmDeleteProduct(
    id,
    button
) {

    button.disabled = true;

    button.textContent =
        'Deleting...';


    try {

        await api(
            '/admin/products/' + id,
            {
                method: 'DELETE'
            }
        );


        const modal =
            button.closest('.modal-overlay');

        if (modal) {
            modal.remove();
        }


        await loadAdminProducts();


        showAdminMessage(
            'Product deleted successfully ✓',
            'success'
        );

    } catch (e) {

        button.disabled = false;

        button.textContent =
            'Yes, Delete';


        const modal =
            button.closest('.modal-overlay');

        if (modal) {
            modal.remove();
        }


        /*
         * This happens when the product
         * already exists in an order.
         */

        if (
            e.message &&
            (
                e.message.toLowerCase().includes('foreign key') ||
                e.message.toLowerCase().includes('constraint') ||
                e.message.toLowerCase().includes('cannot delete')
            )
        ) {

            showAdminMessage(
                'This product cannot be deleted because it is part of an existing order.',
                'error'
            );

        } else {

            showAdminMessage(
                e.message ||
                'Unable to delete product.',
                'error'
            );
        }
    }
}


/* =========================
   ADMIN ORDERS
   ========================= */

async function loadAdminOrders() {

    if (!adminGuard()) return;

    try {

        const os = await api('/admin/orders');

        const root = document.getElementById('adminOrders');

        root.innerHTML = os.length
            ? os.map(o => `
                <div class="card order-card">

                    <h2>
                        #GIF${String(o.id).padStart(5, '0')}
                    </h2>

                    <p>
                        <b>${esc(o.customer_name)}</b>
                        ·
                        ${esc(o.customer_email)}
                    </p>

                    <p>
                        ${esc(o.recipient_name)},
                        ${esc(o.recipient_phone)},
                        ${esc(o.shipping_address)},
                        ${esc(o.city)},
                        ${esc(o.state)}
                        -
                        ${esc(o.pincode)}
                    </p>

                    <p>
                        Total:
                        <b>${money(o.total_amount)}</b>
                        · COD
                    </p>

                    <h4>Items</h4>

                    ${
                        o.items
                            .map(i => `
                                <p>
                                    ${esc(i.product_name)}
                                    × ${i.quantity}
                                    —
                                    ${money(i.subtotal)}
                                </p>
                            `)
                            .join('')
                    }

                    ${
                        o.status === 'CANCELLED'
                            ? `
                                <p class="error">
                                    <b>Order Cancelled</b>
                                </p>
                            `
                            : `
                                <div class="actions">

                                    <select id="status-${o.id}">

                                        ${
                                            [
                                                'PENDING',
                                                'CONFIRMED',
                                                'SHIPPED',
                                                'OUT_FOR_DELIVERY',
                                                'DELIVERED',
                                                'CANCELLED'
                                            ]
                                                .map(s => `
                                                    <option
                                                        value="${s}"
                                                        ${s === o.status ? 'selected' : ''}>
                                                        ${s.replaceAll('_', ' ')}
                                                    </option>
                                                `)
                                                .join('')
                                        }

                                    </select>

                                    <button
                                        onclick="updateOrder(${o.id})">
                                        Update Status
                                    </button>

                                </div>
                            `
                    }

                </div>
            `)
            .join('')
            : '<p>No orders.</p>';

    } catch (e) {

        showAdminMessage(
            e.message || 'Unable to load orders.',
            'error'
        );
    }
}


/* =========================
   UPDATE ORDER STATUS
   ========================= */

async function updateOrder(id) {

    const select = document.getElementById('status-' + id);

    if (!select) return;

    const status = select.value;

    try {

        await api('/admin/orders/' + id + '/status', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                status: status
            })
        });

        await loadAdminOrders();

        showAdminMessage(
            'Order status updated successfully ✓',
            'success'
        );

    } catch (e) {

        showAdminMessage(
            e.message || 'Unable to update order status.',
            'error'
        );
    }
}

/* =========================
   PAGE INITIALIZATION
   ========================= */

document.addEventListener(
    'DOMContentLoaded',
    () => {

        renderAdminNav();


        if (
            location.pathname.includes(
                'admin-dashboard'
            )
        ) {

            dashboard();
        }


        if (
            location.pathname.includes(
                'admin-products'
            )
        ) {

            loadOptions();

            loadAdminProducts();


            const form =
                document.getElementById(
                    'productForm'
                );

            if (form) {
                form.onsubmit =
                    saveProduct;
            }
        }


        if (
            location.pathname.includes(
                'admin-orders'
            )
        ) {

            loadAdminOrders();
        }

    }
);