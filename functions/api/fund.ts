// 基金历史净值和重仓股 API 代理 - Cloudflare Pages Function
export const onRequest: PagesFunction = async (context) => {
  const url = new URL(context.request.url);
  const type = url.searchParams.get('type');
  const code = url.searchParams.get('code');
  const page = url.searchParams.get('page') || '1';
  const per = url.searchParams.get('per') || '30';
  const topline = url.searchParams.get('topline') || '10';

  if (!code) {
    return new Response(JSON.stringify({ error: 'Missing fund code' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    let targetUrl: string;
    if (type === 'jjcc') {
      // 重仓股
      targetUrl = `https://fundf10.eastmoney.com/FundArchivesDatas.aspx?type=jjcc&code=${code}&topline=${topline}`;
    } else {
      // 历史净值
      targetUrl = `https://fundf10.eastmoney.com/F10DataApi.aspx?type=lsjz&code=${code}&page=${page}&per=${per}`;
    }

    const response = await fetch(targetUrl, {
      headers: {
        'Referer': 'https://fund.eastmoney.com/',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    const text = await response.text();
    return new Response(text, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 's-maxage=3600, stale-while-revalidate',
      },
    });
  } catch (error) {
    console.error('Fund data API error:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch fund data' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
