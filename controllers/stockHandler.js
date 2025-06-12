const fetch = require('node-fetch');

const likes = {};

function getClientIP(req) {
  return req.headers['x-forwarded-for'] || req.connection.remoteAddress;
}

async function handleStock(req, res) {
  const { stock, like } = req.query;
  const ip = getClientIP(req);

  if (!stock) return res.status(400).json({ error: 'Missing stock parameter' });

  const symbols = Array.isArray(stock) ? stock : [stock];

  try {
    const result = await Promise.all(symbols.map(async (symbol) => {
      const url = \`https://stock-price-checker-proxy.freecodecamp.rocks/v1/stock/\${symbol}/quote\`;
      const response = await fetch(url);
      const data = await response.json();

      if (!data.symbol || !data.latestPrice) throw new Error('Invalid stock data');

      const sym = data.symbol.toUpperCase();
      if (!likes[sym]) likes[sym] = new Set();

      if (like === 'true') likes[sym].add(ip);

      return {
        stock: sym,
        price: data.latestPrice,
        likes: likes[sym].size
      };
    }));

    if (result.length === 1) {
      res.json({ stockData: result[0] });
    } else {
      const [s1, s2] = result;
      res.json({
        stockData: [
          {
            stock: s1.stock,
            price: s1.price,
            rel_likes: s1.likes - s2.likes
          },
          {
            stock: s2.stock,
            price: s2.price,
            rel_likes: s2.likes - s1.likes
          }
        ]
      });
    }
  } catch (err) {
    res.status(500).json({ error: 'Error fetching stock data' });
  }
}

module.exports = { handleStock };