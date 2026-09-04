async function loadOrders() {
    if (!requireLogin()) return;

    const root = document.getElementById('orders');

    try {
        const os = await api('/orders');

        root.innerHTML = os.length
            ? os.map(o => `
                <div class="card order-card">

                    <h2>#GIF${String(o.id).padStart(5, '0')}</h2>

                    <p>
                        <b>Status:</b>
                        <span class="status">
                            ${o.status.replaceAll('_', ' ')}
                        </span>

                        ${
                            o.status === 'PENDING'
                            ? `
                                <button
                                    class="danger"
                                    onclick="showCancelModal(${o.id})"
                                    style="margin-left: 12px; padding: 7px 12px;">
                                    Cancel Order
                                </button>
                            `
                            : ''
                        }
                    </p>

                    <p>
                        <b>Total:</b>
                        ${money(o.total_amount)} · COD
                    </p>

                    <p>
                        ${esc(o.recipient_name)},
                        ${esc(o.recipient_phone)},
                        ${esc(o.shipping_address)},
                        ${esc(o.city)},
                        ${esc(o.state)} -
                        ${esc(o.pincode)}
                    </p>

                    <h4>Items</h4>

                    ${o.items.map(i => `
                        <p>
                            ${esc(i.product_name)}
                            × ${i.quantity}
                            — ${money(i.subtotal)}
                        </p>
                    `).join('')}

                    <p class="muted">
                        ${new Date(o.created_at).toLocaleString()}
                    </p>

                </div>
            `).join('')
            : '<p>No orders yet.</p>';

    } catch (e) {
        root.innerHTML =
            '<p class="error">' + esc(e.message) + '</p>';
    }
}


// =========================
// SHOW CANCEL CONFIRMATION
// =========================
function showCancelModal(orderId) {

    const modal = document.createElement('div');

    modal.className = 'modal-overlay';

    modal.innerHTML = `
        <div class="modal-box">

            <h2>Cancel Order?</h2>

            <p>
                Are you sure you want to cancel
                <b>#GIF${String(orderId).padStart(5, '0')}</b>?
            </p>

            <p class="muted">
                This action cannot be undone.
            </p>

            <div class="modal-actions">

                <button
                    class="secondary"
                    onclick="this.closest('.modal-overlay').remove()">
                    Keep Order
                </button>

                <button
                    class="danger"
                    onclick="confirmCancelOrder(${orderId}, this)">
                    Yes, Cancel Order
                </button>

            </div>

        </div>
    `;

    document.body.appendChild(modal);
}


// =========================
// CANCEL ORDER
// =========================
async function confirmCancelOrder(orderId, button) {

    button.disabled = true;
    button.textContent = 'Cancelling...';

    try {

        await api(`/orders/${orderId}/cancel`, {
            method: 'POST'
        });

        const modal = button.closest('.modal-overlay');

        if (modal) {
            modal.remove();
        }

        showOrderMessage(
            'Order cancelled successfully ✓',
            'success'
        );

        loadOrders();

    } catch (e) {

        button.disabled = false;
        button.textContent = 'Yes, Cancel Order';

        showOrderMessage(
            e.message,
            'error'
        );
    }
}


// =========================
// WEBSITE MESSAGE
// =========================
function showOrderMessage(message, type) {

    const oldMessage = document.querySelector('.order-message');

    if (oldMessage) {
        oldMessage.remove();
    }

    const messageBox = document.createElement('div');

    messageBox.className = `order-message ${type}`;

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


document.addEventListener('DOMContentLoaded', loadOrders);