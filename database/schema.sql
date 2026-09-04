CREATE DATABASE IF NOT EXISTS giftora;
USE giftora;

CREATE TABLE IF NOT EXISTS users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  phone VARCHAR(20) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('CUSTOMER','ADMIN') NOT NULL DEFAULT 'CUSTOMER',
  is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS categories (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS occasions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(80) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS products (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(150) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  category_id INT NOT NULL,
  occasion_id INT NULL,
  stock INT NOT NULL DEFAULT 0,
  image_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id),
  FOREIGN KEY (occasion_id) REFERENCES occasions(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS wishlist (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  product_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_wishlist_user_product (user_id, product_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS cart (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  UNIQUE KEY uq_cart_user_product (user_id, product_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS addresses (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  recipient_name VARCHAR(100) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  address_line VARCHAR(255) NOT NULL,
  city VARCHAR(100) NOT NULL,
  state VARCHAR(100) NOT NULL,
  pincode VARCHAR(10) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS otp_verifications (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  otp_hash VARCHAR(255) NOT NULL,
  purpose ENUM('EMAIL_VERIFICATION','PASSWORD_RESET') NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS orders (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  status ENUM('PENDING','CONFIRMED','SHIPPED','OUT_FOR_DELIVERY','DELIVERED','CANCELLED') NOT NULL DEFAULT 'PENDING',
  payment_method ENUM('COD') NOT NULL DEFAULT 'COD',
  recipient_name VARCHAR(100) NOT NULL,
  recipient_phone VARCHAR(20) NOT NULL,
  shipping_address VARCHAR(255) NOT NULL,
  city VARCHAR(100) NOT NULL,
  state VARCHAR(100) NOT NULL,
  pincode VARCHAR(10) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS order_items (
  id INT PRIMARY KEY AUTO_INCREMENT,
  order_id INT NOT NULL,
  product_id INT NOT NULL,
  product_name VARCHAR(150) NOT NULL,
  quantity INT NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id)
);

INSERT IGNORE INTO categories (name) VALUES
('Men'),('Women'),('Kids'),('Family'),('Friends');

INSERT IGNORE INTO occasions (name) VALUES
('Birthday'),('Anniversary'),('Wedding'),('Graduation'),('Festival'),('Valentine''s Day');

INSERT INTO products (name, description, price, category_id, occasion_id, stock, image_url)
SELECT 'Personalized Gift Box','A simple personalized gift box for special occasions.',799,
       (SELECT id FROM categories WHERE name='Women'),
       (SELECT id FROM occasions WHERE name='Birthday'),12,'https://placehold.co/600x450?text=Gift+Box'
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name='Personalized Gift Box');

INSERT INTO products (name, description, price, category_id, occasion_id, stock, image_url)
SELECT 'Classic Wrist Watch','Elegant everyday watch suitable as a gift.',999,
       (SELECT id FROM categories WHERE name='Men'),
       (SELECT id FROM occasions WHERE name='Birthday'),8,'https://placehold.co/600x450?text=Watch'
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name='Classic Wrist Watch');

INSERT INTO products (name, description, price, category_id, occasion_id, stock, image_url)
SELECT 'Cute Teddy Bear','Soft teddy bear for kids and friends.',599,
       (SELECT id FROM categories WHERE name='Kids'),
       (SELECT id FROM occasions WHERE name='Festival'),5,'https://placehold.co/600x450?text=Teddy+Bear'
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name='Cute Teddy Bear');

INSERT INTO products (name, description, price, category_id, occasion_id, stock, image_url)
SELECT 'Family Photo Frame','Photo frame designed for family memories.',699,
       (SELECT id FROM categories WHERE name='Family'),
       (SELECT id FROM occasions WHERE name='Anniversary'),7,'https://placehold.co/600x450?text=Photo+Frame'
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name='Family Photo Frame');
