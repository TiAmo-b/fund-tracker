// 基金估值 API 代理
export default async function handler(req, res) {
  const { code } = req.query;

  if (!code) {
    return res.status(400).json({ error: 'Missing fund code' });
  }

  try {
    const response = await fetch(
      `https://fundgz.1234567.com.cn/js/${code}.js?rt=${Date.now()}`,
      {
        headers: {
          'Referer': 'https://fund.eastmoney.com/',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      }
    );

    const text = await response.text();

    // 解析 JSONP 格式
    const match = text.match(/jsonpgz\((.*)\)/);
    if (!match) {
      return res.status(404).json({ error: 'Fund not found' });
    }

    const data = JSON.parse(match[1]);
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate');
    return res.status(200).json(data);
  } catch (error) {
    console.error('Estimate API error:', error);
    return res.status(500).json({ error: 'Failed to fetch fund estimate' });
  }
}
