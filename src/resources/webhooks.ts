import { createHmac, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import {
  InvalidWebhookPayloadError,
  InvalidWebhookSignatureError
} from "../error";
import { Run } from "./runs";

const TOLERANCE = 300;

const Event = z.object({
  type: z.enum(["run.completed", "run.failed"]),
  created: z.string(),
  data: Run
});

export type Event = z.infer<typeof Event>;

const Payload = z
  .string()
  .transform((body) => JSON.parse(body))
  .pipe(Event);

const Signature = z
  .string()
  .transform((header) =>
    Object.fromEntries(header.split(",").map((pair) => pair.split("=")))
  )
  .pipe(z.object({ t: z.coerce.number().int(), v1: z.hex().length(64) }))
  .transform(({ t, v1 }) => ({ timestamp: t, digest: v1 }));

export type VerifyParams = {
  body: string;
  signature: string;
  secret: string;
};

export class Webhooks {
  public verify(params: VerifyParams): Event {
    const { body, signature, secret } = params;

    const header = Signature.safeParse(signature);
    if (!header.success) {
      throw new InvalidWebhookSignatureError("Malformed signature header");
    }

    const { timestamp, digest } = header.data;
    if (!this.isRecent(timestamp)) {
      throw new InvalidWebhookSignatureError("Timestamp outside tolerance");
    }
    if (!this.isSigned(digest, `${timestamp}.${body}`, secret)) {
      throw new InvalidWebhookSignatureError("Signature mismatch");
    }

    const event = Payload.safeParse(body);
    if (!event.success) {
      throw new InvalidWebhookPayloadError("Payload is not a known event");
    }

    return event.data;
  }

  private isRecent(timestamp: number): boolean {
    return Math.abs(Math.floor(Date.now() / 1000) - timestamp) <= TOLERANCE;
  }

  private isSigned(digest: string, message: string, secret: string): boolean {
    const expected = createHmac("sha256", secret).update(message).digest();
    return timingSafeEqual(Buffer.from(digest, "hex"), expected);
  }
}
