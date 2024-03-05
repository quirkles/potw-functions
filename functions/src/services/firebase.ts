import {initializeApp, App} from "firebase-admin/app";

let app: App;
/**
 * Initializes the Firebase Admin app if it hasn't been initialized already.
 *
 * @return {App} The initialized Firebase Admin app.
 */
export function initializeAppAdmin() {
  app = app || initializeApp();
  return app;
}
