/**
 * Server actions and their words. In a production build Next replaces the
 * message of anything a server action throws with a long generic one, so a
 * friendly sentence never reaches the screen that way. Actions the client
 * calls therefore return an ActionResult: `attempt` runs the body and turns a
 * `Friendly` error into its words (anything else into one plain sentence, and
 * the details into the server log), and `unwrap` on the client gives back the
 * value or throws an Error with those words, so the existing catch blocks
 * show them unchanged.
 */
export type ActionResult<T> = { ok: true; value: T } | { ok: false; error: string };

/** An error whose message is written for her to read. */
export class Friendly extends Error {}

const FALLBACK = "That didn’t work — try again.";

export async function attempt<T>(body: () => Promise<T>): Promise<ActionResult<T>> {
  try {
    return { ok: true, value: await body() };
  } catch (e) {
    if (e instanceof Friendly) return { ok: false, error: e.message };
    console.error(e);
    return { ok: false, error: FALLBACK };
  }
}

export function unwrap<T>(result: ActionResult<T>): T {
  if (result.ok) return result.value;
  throw new Error(result.error);
}
