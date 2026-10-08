/**
 * Analytics hooks (currently no-ops).
 *
 * The app calls these from main.jsx and the auth store. They do nothing for now, so no
 * data leaves the browser. To add an analytics or error-tracking service later, put its
 * setup in these functions and the rest of the app needs no changes.
 */

export function initAnalytics() {}

/** Associate subsequent events with a logged-in user. */
export function identifyUser() {}

/** Clear identity on logout. */
export function resetAnalytics() {}

/** Track a custom product event, e.g. capture('source_added', { type }). */
export function capture() {}
