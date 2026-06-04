export function buildBuyLinks(keyword: string) {
  const encodedKeyword = encodeURIComponent(keyword);

  return [
    {
      label: "京东搜索",
      url: `https://search.jd.com/Search?keyword=${encodedKeyword}`
    },
    {
      label: "淘宝搜索",
      url: `https://s.taobao.com/search?q=${encodedKeyword}`
    },
    {
      label: "当当搜索",
      url: `https://search.dangdang.com/?key=${encodedKeyword}`
    }
  ];
}
