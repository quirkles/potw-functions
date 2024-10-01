import {Firestore, getFirestore as originalGetFirestore} from "firebase-admin/firestore";

import {initializeAppAdmin} from "../firebase";

let firestore: Firestore;

export function getFirestore(): Firestore {
  if (!firestore) {
    initializeAppAdmin();
    firestore = originalGetFirestore();
  }
  return firestore;
}
