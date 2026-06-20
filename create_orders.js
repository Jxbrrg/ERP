const API_URL = 'https://erp-teal-phi.vercel.app';
const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6IlN5bmV4QHN5bmV4LmNvbSIsImlhdCI6MTc4MTk3NTEwNCwiZXhwIjoxNzgyMDYxNTA0fQ.7oZ3PkKKGCqePsSjBgJ5x5dcMQzgian0SepAYG2Z0-s';

async function getData(endpoint) {
  const res = await fetch(`${API_URL}${endpoint}`, {
    headers: { 'Authorization': `Bearer ${TOKEN}` }
  });
  return res.json();
}

async function postData(endpoint, body) {
  const res = await fetch(`${API_URL}${endpoint}`, {
    method: 'POST',
    headers: { 
      'Authorization': `Bearer ${TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });
  return res.json();
}

async function main() {
  console.log('Fetching products...');
  const products = await getData('/api/inventory');
  console.log('Products:', products.length);
  
  console.log('Fetching customers...');
  const customers = await getData('/api/crm');
  console.log('Customers:', customers.length);
  
  console.log('Fetching employees...');
  const employees = await getData('/api/employees');
  console.log('Employees:', employees.length);
  
  if (!products.length || !customers.length) {
    console.log('No products or customers!');
    return;
  }
  
  // Create some orders with status variety
  const statuses = ['delivered', 'delivered', 'delivered', 'confirmed', 'shipped', 'pending'];
  const paymentMethods = ['transfer', 'card', 'cash'];
  
  for (let i = 0; i < 15; i++) {
    const customer = customers[Math.floor(Math.random() * customers.length)];
    const employee = employees[Math.floor(Math.random() * employees.length)];
    const numItems = Math.floor(Math.random() * 3) + 1;
    const items = [];
    let total = 0;
    
    for (let j = 0; j < numItems; j++) {
      const product = products[Math.floor(Math.random() * products.length)];
      const qty = Math.floor(Math.random() * 20) + 5;
      items.push({
        product_id: product.id,
        quantity: qty,
        unit_price: product.unit_price
      });
      total += qty * product.unit_price;
    }
    
    const order = {
      customer_id: customer.id,
      employee_id: employee.id,
      items: items,
      payment_method: paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
      notes: 'Demo order'
    };
    
    try {
      const result = await postData('/api/sales', order);
      console.log(`Order ${i+1} created: ${result.code} - $${total.toLocaleString()} - ${statuses[i % statuses.length]}`);
      
      // Update status for some
      if (i < 10) {
        await fetch(`${API_URL}/api/sales/${result.id}`, {
          method: 'PUT',
          headers: { 
            'Authorization': `Bearer ${TOKEN}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            status: statuses[i % statuses.length],
            payment_method: order.payment_method
          })
        });
      }
    } catch (e) {
      console.error('Error creating order:', e.message);
    }
  }
  
  console.log('Done creating orders!');
}

main().catch(console.error);