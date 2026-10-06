export function mockFetch(
  api: (req: Request) => Response | Promise<Response>
): typeof fetch {
  return async (url, init) => api(new Request(url, init));
}
