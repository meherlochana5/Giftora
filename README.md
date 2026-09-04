# Giftora — Full-Stack Gift E-Commerce Platform

A beginner-friendly full-stack project using HTML, CSS, JavaScript, Node.js, Express.js, MySQL, JWT, bcrypt, Nodemailer and Multer.

## 1. Desktop requirements

Install/check these before running:

- Node.js 20+ (`node -v`, `npm -v`)
- MySQL Server 8+ (`mysql --version`)
- VS Code (`code --version`, optional)
- Git (`git --version`, optional)

VS Code does NOT contain MySQL. You can edit/run the Node project in VS Code while MySQL Server runs separately. A VS Code MySQL extension is optional.

## 2. Create the database

Open MySQL Workbench or MySQL command line and run the complete file:

`database/schema.sql`

It creates the `giftora` database and tables.

The seed data includes sample products. You can later add products from the admin portal.

## 3. Install dependencies

Open this project folder in VS Code, then open Terminal:

```bash
npm install
```

## 4. Configure environment variables

Copy:

`.env.example`

to:

`.env`

Then edit the values.

Minimum local setup:

```env
PORT=5000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=YOUR_MYSQL_PASSWORD
DB_NAME=giftora
JWT_SECRET=make_a_long_random_secret
ADMIN_SIGNUP_KEY=giftora-admin-2026
APP_URL=http://localhost:5000
```

OTP emails require SMTP settings. If SMTP is not configured, the server prints the OTP in the terminal in DEVELOPMENT mode, so the project can still be tested locally.

## 5. Start

```bash
npm run dev
```

or:

```bash
npm start
```

Open:

`http://localhost:5000`

Admin:

`http://localhost:5000/admin-login.html`

Admin signup:

`http://localhost:5000/admin-signup.html`

## 6. Important first test

1. Open user signup.
2. Register.
3. If SMTP is not configured, copy the OTP shown in the Node terminal.
4. Verify the OTP.
5. Login.
6. Browse/search/filter products.
7. Add a product to wishlist.
8. Add it to cart.
9. Checkout using COD.
10. Open My Orders.

For admin:
1. Open admin signup.
2. Use the `ADMIN_SIGNUP_KEY` from `.env`.
3. Login from the separate admin login page.
4. Add/edit/delete products.
5. Upload a product image.
6. Update stock/price.
7. View orders and change status.
8. The customer order page updates from the database.

## 7. Project structure

```text
giftora/
├── database/
│   └── schema.sql
├── public/
│   ├── index.html
│   ├── login.html
│   ├── signup.html
│   ├── verify-otp.html
│   ├── forgot-password.html
│   ├── reset-password.html
│   ├── product.html
│   ├── wishlist.html
│   ├── cart.html
│   ├── checkout.html
│   ├── orders.html
│   ├── profile.html
│   ├── admin-login.html
│   ├── admin-signup.html
│   ├── admin-dashboard.html
│   ├── admin-products.html
│   ├── admin-orders.html
│   ├── css/style.css
│   └── js/
│       ├── common.js
│       ├── auth.js
│       ├── product.js
│       ├── cart.js
│       ├── wishlist.js
│       ├── checkout.js
│       ├── orders.js
│       ├── profile.js
│       └── admin.js
├── src/
│   ├── middleware/auth.js
│   ├── routes/auth.js
│   ├── routes/products.js
│   ├── routes/cart.js
│   ├── routes/wishlist.js
│   ├── routes/orders.js
│   ├── routes/admin.js
│   ├── utils/email.js
│   ├── utils/otp.js
│   └── server.js
├── uploads/
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

## 8. Database inspection

After using the site, open MySQL Workbench and run:

```sql
USE giftora;
SELECT * FROM users;
SELECT * FROM products;
SELECT * FROM wishlist;
SELECT * FROM cart;
SELECT * FROM addresses;
SELECT * FROM orders;
SELECT * FROM order_items;
SELECT * FROM otp_verifications;
```

You will see the actual data created by your website.

## 9. What you should understand for interviews

Be able to explain:

- HTTP request/response
- REST APIs
- GET/POST/PUT/DELETE
- Express routes
- Middleware
- JWT authentication
- bcrypt password hashing
- OTP + expiry
- MySQL primary/foreign keys
- joins
- transactions
- cart/wishlist persistence
- server-side price calculation
- stock validation
- role-based admin authorization
- order status lifecycle
- file upload
- environment variables
- deployment

## 10. Security note

This project is an educational portfolio project. Before using it for a real business, add production-grade rate limiting, CSRF protection where applicable, stronger validation, secure cookie/session configuration, object storage for images, logging, backups and other operational controls.
