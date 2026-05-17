export function slugFromPath(pathname: string): string {
  return pathname.replace(/\/$/, '').split('/').pop() || '';
}

export function isActivePage(current: string, target: string): boolean {
  return current === target || current.startsWith(target + '/');
}
