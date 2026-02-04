// 基金历史净值和重仓股 API 代理
export default async function handler(req, res) {
  const { type, code, page = 1, per = 30, topline = 10 } = req.query;

  if (!code) {
    return res.status(400).json({ error: 'Missing fund code' });
  }

  try {
    let url;
    if (type === 'jjcc') {
      // 重仓股
      url = `https://fundf10.eastmoney.com/FundArchivesDatas.aspx?type=jjcc&code=${code}&topline=${topline}`;
    } else {
      // 历史净值
      url = `https://fundf10.eastmoney.com/F10DataApi.aspx?type=lsjz&code=${code}&page=${page}&per=${per}`;
    }

    const response = await fetch(url, {
      headers: {
        'Referer': 'https://fund.eastmoney.com/',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    const text = await response.text();
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send(text);
  } catch (error) {
    console.error('Fund data API error:', error);
    return res.status(500).json({ error: 'Failed to fetch fund data' });
  }
}
