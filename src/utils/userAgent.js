// A named import, so Vite inlines only the version string and none of the
// rest of package.json (author, dependencies) ends up in the bundle.
import { version } from "../../package.json";

/** The default User-Agent of a new request; follows the app version. */
export const DEFAULT_USER_AGENT = `RIP/${version} (REST In Peace Client)`;
