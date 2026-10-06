import { expect, type Mock } from "vitest";

export function mockFetch(
  api: (req: Request) => Response | Promise<Response>
): typeof fetch {
  return async (url, init) => api(new Request(url, init));
}

export function sentRequest(api: Mock<(req: Request) => Response>): Request {
  expect(api).toHaveBeenCalledOnce();
  const call = api.mock.lastCall;
  if (call === undefined) throw new Error("no request was sent");
  return call[0];
}
