import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { Webhooks } from "../../src/resources/webhooks";

const webhooks = new Webhooks();
const secret = "whsec_test";

const event = {
  type: "run.completed",
  created: "2026-10-06T10:00:00.000Z",
  data: {
    run_id: "1d4f6c3e-8a2b-4c7d-9e1f-0a1b2c3d4e5f",
    status: "completed",
    steps: [{ step_id: "extract", status: "completed", output: "facts" }]
  }
};
const body = JSON.stringify(event);

function now(): number {
  return Math.floor(Date.now() / 1000);
}

function sign(params: {
  body: string;
  secret: string;
  timestamp: number;
}): string {
  const { body, secret, timestamp } = params;
  const digest = createHmac("sha256", secret)
    .update(`${timestamp}.${body}`)
    .digest("hex");
  return `t=${timestamp},v1=${digest}`;
}

function rejection(type: string, message: string) {
  return expect.objectContaining({ type, message });
}

describe("Webhooks.constructEvent", () => {
  it("returns the event when the signature matches", () => {
    const signature = sign({ body, secret, timestamp: now() });

    expect(webhooks.constructEvent({ body, signature, secret })).toStrictEqual(
      event
    );
  });

  it("rejects a missing header", () => {
    expect(() =>
      webhooks.constructEvent({ body, signature: null, secret })
    ).toThrow(
      rejection("InvalidWebhookSignatureError", "Missing signature header")
    );
  });

  it("rejects a malformed header", () => {
    expect(() =>
      webhooks.constructEvent({ body, signature: "nope", secret })
    ).toThrow(
      rejection("InvalidWebhookSignatureError", "Malformed signature header")
    );
  });

  it("rejects a delivery older than the tolerance", () => {
    const signature = sign({ body, secret, timestamp: now() - 301 });

    expect(() => webhooks.constructEvent({ body, signature, secret })).toThrow(
      rejection("InvalidWebhookSignatureError", "Timestamp outside tolerance")
    );
  });

  it("rejects a body that was changed after signing", () => {
    const signature = sign({ body, secret, timestamp: now() });

    expect(() =>
      webhooks.constructEvent({ body: `${body} `, signature, secret })
    ).toThrow(rejection("InvalidWebhookSignatureError", "Signature mismatch"));
  });

  it("rejects a delivery signed with another secret", () => {
    const signature = sign({ body, secret: "whsec_other", timestamp: now() });

    expect(() => webhooks.constructEvent({ body, signature, secret })).toThrow(
      rejection("InvalidWebhookSignatureError", "Signature mismatch")
    );
  });

  it("rejects a verified body that isn't a known event", () => {
    const unknown = JSON.stringify({ type: "run.cancelled" });
    const signature = sign({ body: unknown, secret, timestamp: now() });

    expect(() =>
      webhooks.constructEvent({ body: unknown, signature, secret })
    ).toThrow(
      rejection("InvalidWebhookPayloadError", "Payload is not a known event")
    );
  });
});
