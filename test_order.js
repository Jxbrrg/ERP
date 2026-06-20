const API_URL = 'https://erp-teal-phi.vercel.app';
const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6IlN5bmV4QHN5bmV4LmNvbSIsImlhdCI6MTc4MTk3NTEwNCwiZXhwIjoxNzgyMDYxNTA0fQ.7oZ3PkKKGCqePsSjBgJ5x5dcMQzgian0SepAYG2Z0-s';

async function main() {
  // Get products and customers first
  const productsRes = await fetch(`${API_URL}/api/inventory`, {
    headers: { 'Authorization': `Bearer ${TOKEN}` }
  });
  const products = await productsRes.json();
  
  const customersRes = await fetch(`${API_URL}/api/crm`, {
    headers: { 'Authorization': `Bearer ${TOKEN}` }
  });
  const customers = await customersRes.json();
  
  const employeesRes = await fetch(`${API_URL}/api/employees`, {
    headers: { 'Authorization': `Bearer ${TOKEN}` }
  });
  const employees = await employeesRes.json();
  
  console.log('Products:', products.length);
  console.log('Customers:', customers.length);
  console.log('Employees:', employees.length);
  
  if (!products.length || !customers.length || !employees.length) {
    console.log('Missing data!');
    return;
  }
  
  // Create a simple order
  const order = {
    customer_id: customers[0].id,
    employee_id: employees[0].id,
    items: [{
      product_id: products[0].id,
      quantity: 10,
      unit_price: products[0].unit_price
    }],
    payment_method: 'transfer',
    notes: 'Test order'
  };
  
  console.log('Creating order with:', JSON.stringify(order, null, 2));
  
  const res = await fetch(`${API_URL}/api/sales`, {
    method: 'POST',
    headers: { 
      'Authorization': `Bearer ${TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(order)
  });
  
  const result = await res.json();
  console.log('Response status:', res.status);
  console.log('Result:', JSON.stringify(result, null, 2));
  
  // Now check orders again
  const ordersRes = await fetch(`${API_URL}/api/sales`, {
    headers: { 'Authorization': `Bearer ${TOKEN}` }
  });
  const orders = await ordersRes.json();
  console.log('Orders after create:', JSON.stringify(orders, null, 2));
}

main().catch(console.error);