const API_URL = 'https://erp-teal-phi.vercel.app';
const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6IlN5bmV4QHN5bmV4LmNvbSIsImlhdCI6MTc4MTk3NTEwNCwiZXhwIjoxNzgyMDYxNTA0fQ.7oZ3PkKKGCqePsSjBgJ5x5dcMQzgian0SepAYG2Z0-s';

async function main() {
  const res = await fetch(`${API_URL}/api/sales`, {
    headers: { 'Authorization': `Bearer ${TOKEN}` }
  });
  const data = await res.json();
  console.log('Orders:', JSON.stringify(data, null, 2));
}

main().catch(console.error);