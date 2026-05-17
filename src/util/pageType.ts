const pageTypeMap: [string, string][] = [
  ['/services/', 'service'],
  ['/checkup/', 'checkup'],
  ['/blog/', 'article'],
  ['/about/', 'about'],
  ['/compare/', 'compare'],
  ['/materials/', 'materials'],
];

export function getPageType(pathname: string): string {
  for (const [prefix, type] of pageTypeMap) {
    if (pathname.startsWith(prefix)) return type;
  }
  return 'website';
}
