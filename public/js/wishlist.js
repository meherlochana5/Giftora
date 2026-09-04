async function loadWishlist() {

    if (!requireLogin()) return;

    const root = document.getElementById('wishlist');

    try {

        const ps = await api('/wishlist');

        root.innerHTML = ps.length
            ? ps.map(p => `
                
                <article class="product-card">

                    <img
                        src="${esc(p.image_url)}"
                        alt="${esc(p.name)}"
                    >

                    <h3>
                        ${esc(p.name)}
                    </h3>

                    <p class="price">
                        ${money(p.price)}
                    </p>

                    <p>
                        ${
                            p.stock > 0
                                ? 'Available: ' + p.stock
                                : 'Out of Stock'
                        }
                    </p>

                    <div class="actions">

                        <a href="/product.html?id=${p.id}">
                            <button>
                                View
                            </button>
                        </a>

                        ${
                            p.stock > 0
                                ? `
                                    <button
                                        onclick="moveCart(${p.id})">
                                        Add to Cart
                                    </button>
                                `
                                : ''
                        }

                        <button
                            class="danger"
                            onclick="removeWish(${p.id})">
                            ♥ Remove from Wishlist
                        </button>

                    </div>

                </article>

            `).join('')

            : '<p>Your wishlist is empty.</p>';

    } catch (e) {

        root.innerHTML =
            '<p class="error">' +
            esc(e.message) +
            '</p>';
    }
}


// =========================
// MOVE WISHLIST ITEM TO CART
// =========================

async function moveCart(id) {

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

        await removeWish(id);

        showWishlistMessage(
            'Added to cart ✓',
            'success'
        );

    } catch (e) {

        showWishlistMessage(
            e.message,
            'error'
        );
    }
}


// =========================
// REMOVE FROM WISHLIST
// =========================

async function removeWish(id) {

    try {

        await api('/wishlist/' + id, {
            method: 'DELETE'
        });

        await loadWishlist();

        showWishlistMessage(
            'Removed from wishlist ✓',
            'success'
        );

    } catch (e) {

        showWishlistMessage(
            e.message,
            'error'
        );
    }
}


// =========================
// WEBSITE MESSAGE
// =========================

function showWishlistMessage(message, type) {

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


document.addEventListener(
    'DOMContentLoaded',
    loadWishlist
);