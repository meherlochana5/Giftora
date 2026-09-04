const express = require('express');
const pool = require('../../db');
const { requireAuth } = require('../middleware/auth');
const { sendEmail } = require('../utils/email');

const router = express.Router();


// =========================
// GET ALL MY ORDERS
// =========================
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const [orders] = await pool.query(
      'SELECT * FROM orders WHERE user_id=? ORDER BY created_at DESC',
      [req.user.id]
    );

    for (const o of orders) {
      const [items] = await pool.query(
        'SELECT * FROM order_items WHERE order_id=?',
        [o.id]
      );

      o.items = items;
    }

    res.json(orders);
  } catch (e) {
    next(e);
  }
});


// =========================
// PLACE ORDER
// =========================
router.post('/', requireAuth, async (req, res, next) => {
  const conn = await pool.getConnection();

  try {
    const {
      recipientName,
      phone,
      address,
      city,
      state,
      pincode
    } = req.body;

    if (
      !recipientName ||
      !phone ||
      !address ||
      !city ||
      !state ||
      !pincode
    ) {
      return res.status(400).json({
        message: 'Complete all delivery fields.'
      });
    }

    await conn.beginTransaction();

    const [cart] = await conn.query(
      `SELECT
        c.product_id,
        c.quantity,
        p.name,
        p.price,
        p.stock
       FROM cart c
       JOIN products p ON c.product_id=p.id
       WHERE c.user_id=?
       FOR UPDATE`,
      [req.user.id]
    );

    if (!cart.length) {
      await conn.rollback();

      return res.status(400).json({
        message: 'Your cart is empty.'
      });
    }

    let total = 0;

    for (const item of cart) {
      if (item.quantity > item.stock) {
        await conn.rollback();

        return res.status(400).json({
          message: `Not enough stock for ${item.name}.`
        });
      }

      total += Number(item.price) * item.quantity;
    }

    // Create order as PENDING
    const [order] = await conn.query(
      `INSERT INTO orders
      (
        user_id,
        total_amount,
        status,
        payment_method,
        recipient_name,
        recipient_phone,
        shipping_address,
        city,
        state,
        pincode
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.user.id,
        total,
        'PENDING',
        'COD',
        recipientName,
        phone,
        address,
        city,
        state,
        pincode
      ]
    );

    // Save order items and reduce stock
    for (const item of cart) {
      const subtotal = Number(item.price) * item.quantity;

      await conn.query(
        `INSERT INTO order_items
        (
          order_id,
          product_id,
          product_name,
          quantity,
          unit_price,
          subtotal
        )
        VALUES (?, ?, ?, ?, ?, ?)`,
        [
          order.insertId,
          item.product_id,
          item.name,
          item.quantity,
          item.price,
          subtotal
        ]
      );

      await conn.query(
        'UPDATE products SET stock=stock-? WHERE id=?',
        [item.quantity, item.product_id]
      );
    }

    // Clear user's cart
    await conn.query(
      'DELETE FROM cart WHERE user_id=?',
      [req.user.id]
    );

    await conn.commit();

    // Send order email
    const [users] = await pool.query(
      'SELECT email,name FROM users WHERE id=?',
      [req.user.id]
    );

    if (users.length) {
      await sendEmail(
        users[0].email,
        'Giftora Order Received',
        `Hi ${users[0].name}, your order #GIF${String(order.insertId).padStart(5, '0')} was received. Total: ₹${total.toFixed(2)}. Payment: Cash on Delivery.`
      );
    }

    res.status(201).json({
      message: 'Order placed successfully.',
      orderId: order.insertId
    });

  } catch (e) {
    await conn.rollback();
    next(e);
  } finally {
    conn.release();
  }
});


// =========================
// CANCEL PENDING ORDER
// =========================
router.post('/:id/cancel', requireAuth, async (req, res, next) => {
  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    // Lock the order while checking/updating it
    const [orders] = await conn.query(
      `SELECT *
       FROM orders
       WHERE id=? AND user_id=?
       FOR UPDATE`,
      [req.params.id, req.user.id]
    );

    if (!orders.length) {
      await conn.rollback();

      return res.status(404).json({
        message: 'Order not found.'
      });
    }

    const order = orders[0];

    // Customer can cancel ONLY a PENDING order
    if (order.status !== 'PENDING') {
      await conn.rollback();

      return res.status(400).json({
        message: 'This order can no longer be cancelled.'
      });
    }

    // Get ordered products and quantities
    const [items] = await conn.query(
      `SELECT product_id, quantity
       FROM order_items
       WHERE order_id=?`,
      [order.id]
    );

    // Return cancelled quantities to inventory
    for (const item of items) {
      await conn.query(
        'UPDATE products SET stock=stock+? WHERE id=?',
        [item.quantity, item.product_id]
      );
    }

    // Change order status
    await conn.query(
      `UPDATE orders
       SET status='CANCELLED'
       WHERE id=? AND user_id=? AND status='PENDING'`,
      [order.id, req.user.id]
    );

    await conn.commit();

    // Optional cancellation email
    const [users] = await pool.query(
      'SELECT email,name FROM users WHERE id=?',
      [req.user.id]
    );

    if (users.length) {
      await sendEmail(
        users[0].email,
        'Giftora Order Cancelled',
        `Hi ${users[0].name}, your order #GIF${String(order.id).padStart(5, '0')} has been cancelled successfully.`
      );
    }

    res.json({
      message: 'Order cancelled successfully.'
    });

  } catch (e) {
    await conn.rollback();
    next(e);
  } finally {
    conn.release();
  }
});


// =========================
// GET SINGLE ORDER
// =========================
router.get('/:id', requireAuth, async (req, res, next) => {
  try {
    const [orders] = await pool.query(
      'SELECT * FROM orders WHERE id=? AND user_id=?',
      [req.params.id, req.user.id]
    );

    if (!orders.length) {
      return res.status(404).json({
        message: 'Order not found.'
      });
    }

    const [items] = await pool.query(
      'SELECT * FROM order_items WHERE order_id=?',
      [req.params.id]
    );

    orders[0].items = items;

    res.json(orders[0]);

  } catch (e) {
    next(e);
  }
});


module.exports = router;