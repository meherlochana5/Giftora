let selectedCategory = '';

let cartProductIds = new Set();
let wishlistProductIds = new Set();


// =========================
// LOAD CATEGORIES & OCCASIONS
// =========================

async function loadMeta() {
    const d = await api('/products/meta/options');

    const cb = document.getElementById('categoryButtons');

    if (cb) {
        cb.innerHTML = d.categories
            .map(c =>
                `<button onclick="setCategory('${esc(c.name)}')">
                    ${esc(c.name)}
                </button>`
            )
            .join('');
    }

    const oc = document.getElementById('occasion');

    if (oc) {
        oc.innerHTML =
            '<option value="">All occasions</option>' +
            d.occasions
                .map(o =>
                    `<option value="${esc(o.name)}">
                        ${esc(o.name)}
                    </option>`
                )
                .join('');
    }
}


// =========================
// LOAD USER CART & WISHLIST
// =========================

async function loadUserStates() {

    cartProductIds = new Set();
    wishlistProductIds = new Set();

    if (!localStorage.getItem('token')) {
        return;
    }

    try {

        const [cartItems, wishlistItems] = await Promise.all([
            api('/cart'),
            api('/wishlist')
        ]);

        cartProductIds = new Set(
            cartItems.map(item => Number(item.product_id))
        );

        wishlistProductIds = new Set(
            wishlistItems.map(item => Number(item.id))
        );

    } catch (e) {
        console.log('Could not load cart/wishlist state.');
    }
}


// =========================
// CATEGORY FILTER
// =========================

function setCategory(c) {
    selectedCategory = c;
    loadProducts();
}


// =========================
// CLEAR FILTERS
// =========================

function clearFilters() {

    selectedCategory = '';

    const search = document.getElementById('search');
    const occasion = document.getElementById('occasion');
    const minPrice = document.getElementById('minPrice');
    const maxPrice = document.getElementById('maxPrice');

    if (search) search.value = '';
    if (occasion) occasion.value = '';
    if (minPrice) minPrice.value = '';
    if (maxPrice) maxPrice.value = '';

    loadProducts();
}


// =========================
// LOAD PRODUCTS
// =========================

async function loadProducts() {

    const root = document.getElementById('products');

    if (!root) return;

    const q = new URLSearchParams();

    const search =
        document.getElementById('search')?.value || '';

    const occasion =
        document.getElementById('occasion')?.value || '';

    const minPrice =
        document.getElementById('minPrice')?.value || '';

    const maxPrice =
        document.getElementById('maxPrice')?.value || '';


    if (search) {
        q.set('search', search);
    }

    if (selectedCategory) {
        q.set('category', selectedCategory);
    }

    if (occasion) {
        q.set('occasion', occasion);
    }

    if (minPrice) {
        q.set('minPrice', minPrice);
    }

    if (maxPrice) {
        q.set('maxPrice', maxPrice);
    }


    try {

        const ps = await api('/products?' + q.toString());

        root.innerHTML = ps.length
            ? ps.map(productCard).join('')
            : '<p>No products found.</p>';

    } catch (e) {

        root.innerHTML =
            '<p class="error">' +
            esc(e.message) +
            '</p>';
    }
}


// =========================
// PRODUCT CARD
// =========================

function productCard(p) {

    const inCart =
        cartProductIds.has(Number(p.id));

    const inWishlist =
        wishlistProductIds.has(Number(p.id));


    return `
        <article class="product-card">

            <img
                src="${esc(
                    p.image_url ||
                    'https://placehold.co/600x450?text=Giftora'
                )}"
                alt="${esc(p.name)}"
            >

            <h3>${esc(p.name)}</h3>

            <p class="muted">
                ${esc(p.category_name)}
                ·
                ${esc(p.occasion_name || 'Any occasion')}
            </p>

            <p class="price">
                ${money(p.price)}
            </p>

            <p>
                ${
                    p.stock > 0
                        ? `Available: ${p.stock}`
                        : '<b class="error">Out of Stock</b>'
                }
            </p>

            <div class="actions">

                <a href="/product.html?id=${p.id}">
                    <button>
                        View
                    </button>
                </a>


                <button
                    class="secondary"
                    onclick="quickWish(${p.id})"
                    id="wish-btn-${p.id}">

                    ${
                        inWishlist
                            ? '♥ In Wishlist'
                            : '❤️ Wishlist'
                    }

                </button>


                ${
                    p.stock > 0
                        ? `
                            <button
                                onclick="quickCart(${p.id})"
                                id="cart-btn-${p.id}">

                                ${
                                    inCart
                                        ? '✓ In Cart'
                                        : 'Add to Cart'
                                }

                            </button>
                        `
                        : ''
                }

            </div>

        </article>
    `;
}


// =========================
// ADD TO CART
// =========================

async function quickCart(id) {

    if (!requireLogin()) return;


    if (cartProductIds.has(Number(id))) {

        showProductMessage(
            'Already in cart',
            'success'
        );

        return;
    }


    try {

        await api('/cart', {
            method: 'POST',

            headers: {
                'Content-Type': 'application/json'
            },

            body: JSON.stringify({
                productId: id,
                quantity: 1
            })
        });


        cartProductIds.add(Number(id));


        const button =
            document.getElementById(`cart-btn-${id}`);


        if (button) {
            button.textContent = '✓ In Cart';
        }


        showProductMessage(
            'Added to cart ✓',
            'success'
        );


    } catch (e) {

        showProductMessage(
            e.message,
            'error'
        );
    }
}


// =========================
// ADD TO WISHLIST
// =========================

async function quickWish(id) {

    if (!requireLogin()) return;

    const productId = Number(id);

    try {

        // =========================
        // REMOVE FROM WISHLIST
        // =========================

        if (wishlistProductIds.has(productId)) {

            await api('/wishlist/' + id, {
                method: 'DELETE'
            });

            wishlistProductIds.delete(productId);

            // Product card button
            const cardButton =
                document.getElementById(`wish-btn-${id}`);

            if (cardButton) {
                cardButton.textContent = '❤️ Wishlist';
            }

            // Product detail button
            const detailButton =
                document.getElementById('detail-wish-btn');

            if (detailButton) {
                detailButton.textContent = '❤️ Wishlist';
            }

            showProductMessage(
                'Removed from wishlist ✓',
                'success'
            );

            return;
        }


        // =========================
        // ADD TO WISHLIST
        // =========================

        await api('/wishlist/' + id, {
            method: 'POST'
        });

        wishlistProductIds.add(productId);

        // Product card button
        const cardButton =
            document.getElementById(`wish-btn-${id}`);

        if (cardButton) {
            cardButton.textContent = '♥ In Wishlist';
        }

        // Product detail button
        const detailButton =
            document.getElementById('detail-wish-btn');

        if (detailButton) {
            detailButton.textContent = '♥ In Wishlist';
        }

        showProductMessage(
            'Added to wishlist ♥',
            'success'
        );
    }

    catch (e) {

        showProductMessage(
            e.message,
            'error'
        );
    }
}


// =========================
// PRODUCT MESSAGE
// =========================

function showProductMessage(message, type) {

    const oldMessage =
        document.querySelector('.product-message');

    if (oldMessage) {
        oldMessage.remove();
    }


    const messageBox =
        document.createElement('div');


    messageBox.className =
        `product-message ${type}`;


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

    }, 2500);
}


// =========================
// PRODUCT DETAIL
// =========================

async function loadProductDetail() {

    const root =
        document.getElementById('productDetail');

    if (!root) return;


    const id =
        new URLSearchParams(location.search).get('id');


    if (!id) {

        root.innerHTML =
            '<p>Product not found.</p>';

        return;
    }


    try {

        const p =
            await api('/products/' + id);


        const inCart =
            cartProductIds.has(Number(p.id));


        const inWishlist =
            wishlistProductIds.has(Number(p.id));


        root.innerHTML = `

            <div class="product-detail">

                <img
                    src="${esc(p.image_url)}"
                    alt="${esc(p.name)}"
                >


                <div>

                    <h1>
                        ${esc(p.name)}
                    </h1>


                    <p class="muted">

                        ${esc(p.category_name)}
                        ·
                        ${esc(
                            p.occasion_name ||
                            'Any occasion'
                        )}

                    </p>


                    <p class="price">
                        ${money(p.price)}
                    </p>


                    <p>
                        ${esc(p.description)}
                    </p>


                    <p>

                        ${
                            p.stock > 0
                                ? 'Available stock: ' +
                                  p.stock
                                : 'OUT OF STOCK'
                        }

                    </p>


                    ${
                        p.stock > 0
                            ? `

                                <input
                                    id="qty"
                                    type="number"
                                    min="1"
                                    max="${p.stock}"
                                    value="1"
                                >


                                <div class="actions">

                                    <button
                                        onclick="addDetailToCart(${p.id})"
                                        id="detail-cart-btn">

                                        ${
                                            inCart
                                                ? '✓ In Cart'
                                                : 'Add to Cart'
                                        }

                                    </button>


                                    <button
                                        class="secondary"
                                        onclick="quickWish(${p.id})"
                                        id="detail-wish-btn">

                                        ${
                                            inWishlist
                                                ? '♥ In Wishlist'
                                                : '❤️ Wishlist'
                                        }

                                    </button>

                                </div>

                            `
                            : `

                                <button
                                    class="secondary"
                                    onclick="quickWish(${p.id})"
                                    id="detail-wish-btn">

                                    ${
                                        inWishlist
                                            ? '♥ In Wishlist'
                                            : '❤️ Add to Wishlist'
                                    }

                                </button>

                            `
                    }

                </div>

            </div>
        `;


    } catch (e) {

        root.innerHTML =
            '<p class="error">' +
            esc(e.message) +
            '</p>';
    }
}


// =========================
// ADD FROM PRODUCT DETAIL
// =========================

async function addDetailToCart(id) {

    if (!requireLogin()) return;


    if (cartProductIds.has(Number(id))) {

        showProductMessage(
            'Already in cart',
            'success'
        );

        return;
    }


    const qtyInput =
        document.getElementById('qty');


    const quantity =
        Number(qtyInput?.value || 1);


    try {

        await api('/cart', {

            method: 'POST',

            headers: {
                'Content-Type': 'application/json'
            },

            body: JSON.stringify({
                productId: id,
                quantity: quantity
            })

        });


        cartProductIds.add(Number(id));


        const button =
            document.getElementById(
                'detail-cart-btn'
            );


        if (button) {
            button.textContent = '✓ In Cart';
        }


        showProductMessage(
            'Added to cart ✓',
            'success'
        );


    } catch (e) {

        showProductMessage(
            e.message,
            'error'
        );
    }
}


// =========================
// FILTER EVENTS
// =========================

document.addEventListener(
    'DOMContentLoaded',
    async () => {

        await loadMeta();

        await loadUserStates();

        const search =
            document.getElementById('search');

        const occasion =
            document.getElementById('occasion');

        const minPrice =
            document.getElementById('minPrice');

        const maxPrice =
            document.getElementById('maxPrice');


        if (occasion) {
            occasion.addEventListener(
                'change',
                loadProducts
            );
        }


        if (minPrice) {
            minPrice.addEventListener(
                'change',
                loadProducts
            );
        }


        if (maxPrice) {
            maxPrice.addEventListener(
                'change',
                loadProducts
            );
        }


        if (search) {
            search.addEventListener(
                'input',
                loadProducts
            );
        }


        await loadProducts();

        await loadProductDetail();

    }
);