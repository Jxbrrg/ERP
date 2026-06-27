// Minimal Vercel serverless function - no external modules, no server/index
module.exports = (req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    ok: true,
    vercel: !!process.env.VERCEL,
    node: process.version,
    env: Object.keys(process.env).filter(k => !k.includes('SECRET') && !k.includes('KEY') && !k.includes('TOKEN')).slice(0, 20)
  }));
};
