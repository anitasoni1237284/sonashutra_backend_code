-- Pehla Part: (Top-left section — User, Role, Permissions, etc.)
-- Table: role
CREATE TABLE sn_role (
    roleId INT AUTO_INCREMENT PRIMARY KEY,
    roleName VARCHAR(255) NOT NULL
);

-- Table: user
CREATE TABLE sn_user (
    userId INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    roleId INT,
    status VARCHAR(50),
    createdAt DATETIME,
    updatedAt DATETIME,
    FOREIGN KEY (roleId) REFERENCES sn_role(roleId)
);

-- Table: rolePermission
CREATE TABLE sn_role_permission (
    id INT AUTO_INCREMENT PRIMARY KEY,
    roleId INT NOT NULL,
    permissionId INT NOT NULL,
    FOREIGN KEY (roleId) REFERENCES sn_role(roleId),
    FOREIGN KEY (permissionId) REFERENCES sn_permission(permissionId)
);

-- Table: permission
CREATE TABLE sn_permission (
    permissionId INT AUTO_INCREMENT PRIMARY KEY,
    permissionName VARCHAR(255) NOT NULL
);

-- Table: auditLog
CREATE TABLE sn_auditLog (
    logId INT AUTO_INCREMENT PRIMARY KEY,
    userId INT,
    action VARCHAR(255),
    timestamp DATETIME,
    FOREIGN KEY (userId) REFERENCES sn_user(userId)
);
-- Part 2: Product, Category, Inventory, Order Tables
-- Table: product_category
CREATE TABLE sn_product_category (
    product_category_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT
);

-- Table: product
CREATE TABLE sn_product (
    product_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    product_category_id INT,
    created_at DATETIME,
    updated_at DATETIME,
    FOREIGN KEY (product_category_id) REFERENCES sn_product_category(product_category_id)
        ON DELETE CASCADE
);

-- Table: product_inventory
CREATE TABLE sn_product_inventory (
    inventory_id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    quantity INT NOT NULL,
    last_updated DATETIME,
    FOREIGN KEY (product_id) REFERENCES sn_product(product_id)
        ON DELETE CASCADE
);

-- Table: customer
CREATE TABLE sn_customer (
    customer_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(20),
    created_at DATETIME,
    updated_at DATETIME
);

-- Table: customer_order
CREATE TABLE sn_customer_order (
    order_id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT NOT NULL,
    order_date DATETIME NOT NULL,
    status VARCHAR(100),
    total_amount DECIMAL(10,2),
    FOREIGN KEY (customer_id) REFERENCES sn_customer(customer_id)
        ON DELETE CASCADE
);

-- Table: order_item
CREATE TABLE sn_order_item (
    order_item_id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (order_id) REFERENCES sn_customer_order(order_id)
        ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES sn_product(product_id)
        ON DELETE CASCADE
);
-- Part 3: Payment, Shipping, Supplier, Discounts, Taxes
-- Table: payment
CREATE TABLE sn_payment (
    payment_id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    payment_method VARCHAR(100),
    payment_status VARCHAR(100),
    payment_date DATETIME,
    amount DECIMAL(10,2),
    FOREIGN KEY (order_id) REFERENCES sn_customer_order(order_id)
        ON DELETE CASCADE
);

-- Table: shipping_detail
CREATE TABLE sn_shipping_detail (
    shipping_id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    address VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100),
    shipped_date DATETIME,
    delivery_date DATETIME,
    status VARCHAR(50),
    FOREIGN KEY (order_id) REFERENCES sn_customer_order(order_id)
        ON DELETE CASCADE
);

-- Table: supplier
CREATE TABLE sn_supplier (
    supplier_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    contact_name VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(20),
    address TEXT
);

-- Table: product_supplier
CREATE TABLE sn_product_supplier (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    supplier_id INT NOT NULL,
    supply_price DECIMAL(10,2),
    FOREIGN KEY (product_id) REFERENCES sn_product(product_id)
        ON DELETE CASCADE,
    FOREIGN KEY (supplier_id) REFERENCES sn_supplier(supplier_id)
        ON DELETE CASCADE
);

-- Table: discount
CREATE TABLE sn_discount (
    discount_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255),
    discount_type VARCHAR(50),
    value DECIMAL(10,2),
    start_date DATE,
    end_date DATE,
    is_active BOOLEAN DEFAULT TRUE
);

-- Table: product_discount
CREATE TABLE sn_product_discount (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    discount_id INT NOT NULL,
    FOREIGN KEY (product_id) REFERENCES sn_product(product_id)
        ON DELETE CASCADE,
    FOREIGN KEY (discount_id) REFERENCES sn_discount(discount_id)
        ON DELETE CASCADE
);

-- Table: tax
CREATE TABLE sn_tax (
    tax_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100),
    percentage DECIMAL(5,2),
    is_active BOOLEAN DEFAULT TRUE
);

-- Table: product_tax
CREATE TABLE sn_product_tax (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    tax_id INT NOT NULL,
    FOREIGN KEY (product_id) REFERENCES sn_product(product_id)
        ON DELETE CASCADE,
    FOREIGN KEY (tax_id) REFERENCES sn_tax(tax_id)
        ON DELETE CASCADE
);
-- Part 4: Reviews, Wishlist, Cart, Returns, Activity Logs
-- Table: product_review
CREATE TABLE sn_product_review (
    review_id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    customer_id INT NOT NULL,
    rating INT CHECK (rating BETWEEN 1 AND 5),
    review_text TEXT,
    review_date DATETIME,
    FOREIGN KEY (product_id) REFERENCES sn_product(product_id)
        ON DELETE CASCADE,
    FOREIGN KEY (customer_id) REFERENCES sn_customer(customer_id)
        ON DELETE CASCADE
);

-- Table: wishlist
CREATE TABLE sn_wishlist (
    wishlist_id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT NOT NULL,
    created_at DATETIME,
    FOREIGN KEY (customer_id) REFERENCES sn_customer(customer_id)
        ON DELETE CASCADE
);

-- Table: wishlist_item
CREATE TABLE sn_wishlist_item (
    wishlist_item_id INT AUTO_INCREMENT PRIMARY KEY,
    wishlist_id INT NOT NULL,
    product_id INT NOT NULL,
    FOREIGN KEY (wishlist_id) REFERENCES sn_wishlist(wishlist_id)
        ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES sn_product(product_id)
        ON DELETE CASCADE
);

-- Table: cart
CREATE TABLE sn_cart (
    cart_id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT NOT NULL,
    created_at DATETIME,
    FOREIGN KEY (customer_id) REFERENCES sn_customer(customer_id)
        ON DELETE CASCADE
);

-- Table: cart_item
CREATE TABLE sn_cart_item (
    cart_item_id INT AUTO_INCREMENT PRIMARY KEY,
    cart_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL,
    FOREIGN KEY (cart_id) REFERENCES sn_cart(cart_id)
        ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES sn_product(product_id)
        ON DELETE CASCADE
);

-- Table: return_request
CREATE TABLE sn_return_request (
    return_id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    customer_id INT NOT NULL,
    reason TEXT,
    request_date DATETIME,
    status VARCHAR(50),
    FOREIGN KEY (order_id) REFERENCES sn_customer_order(order_id)
        ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES sn_product(product_id)
        ON DELETE CASCADE,
    FOREIGN KEY (customer_id) REFERENCES sn_customer(customer_id)
        ON DELETE CASCADE
);

-- Table: customer_activity_log
CREATE TABLE sn_customer_activity_log (
    activity_id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT NOT NULL,
    activity_type VARCHAR(100),
    description TEXT,
    activity_time DATETIME,
    FOREIGN KEY (customer_id) REFERENCES sn_customer(customer_id)
        ON DELETE CASCADE
);
-- Part 5: Coupons, Shipping Methods, Product Attributes, Notifications, Settings
-- Table: coupon
CREATE TABLE sn_coupon (
    coupon_id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    discount_type VARCHAR(50), -- e.g., 'percentage' or 'fixed'
    value DECIMAL(10,2),
    start_date DATE,
    end_date DATE,
    is_active BOOLEAN DEFAULT TRUE
);

-- Table: customer_coupon
CREATE TABLE sn_customer_coupon (
    id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT NOT NULL,
    coupon_id INT NOT NULL,
    used_at DATETIME,
    FOREIGN KEY (customer_id) REFERENCES sn_customer(customer_id)
        ON DELETE CASCADE,
    FOREIGN KEY (coupon_id) REFERENCES sn_coupon(coupon_id)
        ON DELETE CASCADE
);

-- Table: shipping_method
CREATE TABLE sn_shipping_method (
    shipping_method_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100),
    description TEXT,
    cost DECIMAL(10,2)
);

-- Table: product_attribute
CREATE TABLE sn_product_attribute (
    attribute_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL
);

-- Table: product_attribute_value
CREATE TABLE sn_product_attribute_value (
    value_id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    attribute_id INT NOT NULL,
    value VARCHAR(255),
    FOREIGN KEY (product_id) REFERENCES sn_product(product_id)
        ON DELETE CASCADE,
    FOREIGN KEY (attribute_id) REFERENCES sn_product_attribute(attribute_id)
        ON DELETE CASCADE
);

-- Table: notification_preference
CREATE TABLE sn_notification_preference (
    preference_id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT NOT NULL,
    email_notifications BOOLEAN DEFAULT TRUE,
    sms_notifications BOOLEAN DEFAULT FALSE,
    push_notifications BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (customer_id) REFERENCES sn_customer(customer_id)
        ON DELETE CASCADE
);

-- Table: system_setting
CREATE TABLE sn_system_setting (
    setting_key VARCHAR(100) PRIMARY KEY,
    setting_value TEXT,
    updated_at DATETIME
);
-- Create store table
-- 2. Update related tables to include store_id as foreign key
-- Table: store
CREATE TABLE sn_store (
    store_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    address VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100),
    phone VARCHAR(20),
    email VARCHAR(255),
    created_at DATETIME,
    updated_at DATETIME
);

ALTER TABLE sn_product
ADD COLUMN store_id INT,
ADD FOREIGN KEY (store_id) REFERENCES sn_tore(store_id)
    ON DELETE CASCADE;

ALTER TABLE sn_customer_order
ADD COLUMN store_id INT,
ADD FOREIGN KEY (store_id) REFERENCES sn_store(store_id)
    ON DELETE CASCADE;

ALTER TABLE sn_user
ADD COLUMN store_id INT,
ADD FOREIGN KEY (store_id) REFERENCES sn_store(store_id)
    ON DELETE CASCADE;

