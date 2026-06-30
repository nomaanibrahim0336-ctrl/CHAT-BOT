// Mocked ecommerce/OMS data layer. Replace with real Shopify/OMS API calls
// (see Shopify MCP tools or REST Admin API) while keeping this module's
// function signatures intact so the orchestrator/tool layer doesn't change.

const ORDERS = {
  '1001': {
    orderId: '1001',
    status: 'shipped',
    carrier: 'UPS',
    trackingNumber: '1Z999AA10123456784',
    estimatedDelivery: '2026-07-03',
    items: [{ name: 'Wireless Headphones', qty: 1 }],
  },
  '1002': {
    orderId: '1002',
    status: 'processing',
    carrier: null,
    trackingNumber: null,
    estimatedDelivery: '2026-07-05',
    items: [{ name: 'Running Shoes', qty: 1, size: '10' }],
  },
};

const PRODUCTS = [
  { id: 'p1', name: 'Wireless Headphones', price: 79.99, color: 'black', tags: ['electronics', 'audio', 'best-seller'] },
  { id: 'p2', name: 'Running Shoes', price: 89.99, color: 'red', size: ['8', '9', '10', '11'], tags: ['footwear', 'best-seller'] },
  { id: 'p3', name: 'Yoga Mat', price: 29.99, color: 'purple', tags: ['fitness'] },
  { id: 'p4', name: 'Smart Watch', price: 149.99, color: 'black', tags: ['electronics', 'best-seller'] },
];

function getOrderStatus(orderId) {
  const order = ORDERS[orderId];
  if (!order) return { error: `No order found with ID ${orderId}` };
  return order;
}

function searchProducts({ query, color, maxPrice } = {}) {
  let results = PRODUCTS;
  if (query) {
    const q = query.toLowerCase();
    results = results.filter(
      (p) => p.name.toLowerCase().includes(q) || p.tags.some((t) => t.includes(q))
    );
  }
  if (color) results = results.filter((p) => p.color.toLowerCase() === color.toLowerCase());
  if (maxPrice) results = results.filter((p) => p.price <= maxPrice);
  return results;
}

module.exports = { getOrderStatus, searchProducts };
