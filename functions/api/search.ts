// 基金搜索 API 代理 - Cloudflare Pages Function
export const onRequest: PagesFunction = async (context) => {
  const url = new URL(context.request.url);
  const keyword = url.searchParams.get('keyword');

  if (!keyword) {
    return new Response(JSON.stringify({ error: 'Missing keyword' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
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
      return new Response(JSON.stringify({ Datas: [] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const data = JSON.parse(match[1]);
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 's-maxage=300, stale-while-revalidate',
      },
    });
  } catch (error) {
    console.error('Search API error:', error);
    return new Response(JSON.stringify({ error: 'Failed to search funds' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
