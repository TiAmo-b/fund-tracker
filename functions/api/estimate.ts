// 基金估值 API 代理 - Cloudflare Pages Function
export const onRequest: PagesFunction = async (context) => {
  const url = new URL(context.request.url);
  const code = url.searchParams.get('code');

  if (!code) {
    return new Response(JSON.stringify({ error: 'Missing fund code' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
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
      return new Response(JSON.stringify({ error: 'Fund not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const data = JSON.parse(match[1]);
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 's-maxage=60, stale-while-revalidate',
      },
    });
  } catch (error) {
    console.error('Estimate API error:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch fund estimate' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
