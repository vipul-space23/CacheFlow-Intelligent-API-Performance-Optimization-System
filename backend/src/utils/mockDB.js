const products = Array.from({ length: 50 }, (_, i) => ({
    id: i + 1,
    name: `Product ${i + 1}`,
    price: Math.floor(Math.random() * 100) + 10,
    category: ['Electronics', 'Clothing', 'Books', 'Home'][Math.floor(Math.random() * 4)],
    stock: Math.floor(Math.random() * 500)
}));

// Simulate database delay
const fetchProducts = async () => {
    return new Promise((resolve) => {
        setTimeout(() => resolve(products), 800); // 800ms delay to simulate DB
    });
};

const fetchProductById = async (id) => {
    return new Promise((resolve) => {
        setTimeout(() => {
            const product = products.find(p => p.id === parseInt(id));
            resolve(product);
        }, 500); // 500ms delay
    });
};

module.exports = {
    fetchProducts,
    fetchProductById
};
