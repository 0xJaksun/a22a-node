<img src=".github/logo.jpg" alt="A22A" width="100%">

# A22A Node.js Library

The A22A Node.js library provides convenient access to the A22A API from applications written in server-side JavaScript and TypeScript.

## Documentation

See the [A22A docs](https://a22a.sh/docs).

## Requirements

Node.js 20.19 or later.

## Installation

```sh
npm install a22a
```

## Usage

The package needs to be configured with your account's API key, which is available on the [A22A dashboard](https://a22a.sh).

```ts
import { A22A } from "a22a";

const a22a = new A22A({ apiKey: "a22a_…" });

const { run_id } = await a22a.runs.invoke({
  project: "acme",
  workflow: "summarise",
  input: { text: "…" }
});
```

### Usage with TypeScript

Types are bundled. Request and response shapes are importable by name.

```ts
import type { Manifest, Run, WebhookEvent } from "a22a";
```

## Deploying a project

A project is a set of named workflows. A workflow is a list of steps. A step is a prompt. Deploy them together as one document; each deploy creates a new version, and runs in progress stay on the version they started with.

```ts
await a22a.projects.deploy({
  project: "acme",
  workflows: {
    summarise: {
      steps: [
        { id: "extract", prompt: "Pull the key facts from {{input.text}}" },
        {
          id: "write",
          prompt: "Write a summary from {{extract.output}}",
          needs: ["extract"]
        }
      ]
    }
  }
});
// { project: "acme", version: 1, workflows: ["summarise"] }
```

Prompts read the run's input with `{{input.<field>}}` and an earlier step's output with `{{<step>.output}}`. A step with `needs` runs after those steps; steps without `needs` run first, in parallel. Give a step an `output` shape to have it answer in JSON:

```ts
{
  id: "extract",
  prompt: "Pull the key facts from {{input.text}}",
  output: { title: "string", facts: "string[]" }
}
```

Later steps then read `{{extract.output.title}}`.

```ts
await a22a.projects.retrieve("acme");
// { id: "…", project: "acme", version: 1, manifest: { … } }
```

## Invoking a workflow

```ts
const { run_id } = await a22a.runs.invoke({
  project: "acme",
  workflow: "summarise",
  input: { text: "…" }
});
```

The run is queued on the project's latest version and the call returns at once. `input` must supply every `{{input.*}}` field the workflow reads.

## Retrieving a run

```ts
const run = await a22a.runs.retrieve(run_id);
// { run_id: "4b3e…", status: "completed", steps: [ … ] }
```

A run is `queued`, then `running`, then `completed` or `failed`. Each step is `pending`, `running`, `completed` with its `output`, or `failed` with its `error`. One failed step fails the run, and the run carries an `error` of its own.

```ts
{
  run_id: "4b3e…",
  status: "completed",
  steps: [
    { step_id: "extract", status: "completed", output: "…" },
    { step_id: "write", status: "completed", output: "…" }
  ]
}
```

## Webhook signing

A22A posts `run.completed` and `run.failed` to the endpoint set on your dashboard, signed with the endpoint's secret. Verify the signature and parse the event with `constructEvent`. Pass the raw request body; the signature covers the exact bytes sent.

```ts
export async function POST(req: Request) {
  const event = a22a.webhooks.constructEvent({
    body: await req.text(),
    signature: req.headers.get("a22a-signature"),
    secret: "whsec_…"
  });
  // { type: "run.completed", created: "…", data: { run_id, status, steps } }

  if (event.type === "run.completed") await save(event.data);

  return new Response(null, { status: 200 });
}
```

A missing, malformed, stale or mismatched signature throws `InvalidWebhookSignatureError`. Respond with a 2xx once you have handled the event; anything else is retried.

## Handling errors

When the library is unable to connect to the API, or the API returns a non-2xx status, a subclass of `APIError` is thrown. Every class is also reachable as `A22A.errors.<Name>`.

```ts
try {
  await a22a.runs.retrieve(run_id);
} catch (err) {
  if (err instanceof A22A.errors.APIError) {
    console.log(err.status);     // 404
    console.log(err.code);       // "not_found"
    console.log(err.requestId);  // quote this when reporting a problem
  }
  throw err;
}
```

| Status Code          | Error Type             |
| -------------------- | ---------------------- |
| 400                  | `BadRequestError`      |
| 401                  | `AuthenticationError`  |
| 404                  | `NotFoundError`        |
| >=500                | `InternalServerError`  |
| 2xx, unexpected body | `InvalidResponseError` |
| N/A                  | `APIConnectionError`   |

## License

MIT