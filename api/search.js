// 基金搜索 API 代理
export default async function handler(req, res) {
  const { keyword } = req.query;

  if (!keyword) {
    return res.status(400).json({ error: 'Missing keyword' });
  }

  try {
    const response = await fetch(
      `https://fundsuggest.eastmoney.com/FundSearch/api/FundSearchAPI.ashx?callback=cb&m=1&key=${encodeURIComponent(keyword)}`,
      {
        headers: {
          'Referer': 'https://fund.eastmoney.com/',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      }
    );

    const text = await response.text();

    // 解析 JSONP 格式
    const match = text.match(/cb\((.*)\)/);
    if (!match) {
      return res.status(200).json({ Datas: [] });
    }

    const data = JSON.parse(match[1]);
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate');
    return res.status(200).json(data);
  } catch (error) {
    console.error('Search API error:', error);
    return res.status(500).json({ error: 'Failed to search funds' });
  }
}
