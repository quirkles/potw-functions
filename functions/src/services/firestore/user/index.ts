import {getFirestore} from "firebase-admin/firestore";
/**
 * This function checks if a user with the given email exists in the Firestore database.
 * If the user exists, it returns the user's ID.
 * If the user does not exist, it creates a new user with the given email and returns the new user's ID.
 *
 * @param {string} email - The email of the user.
 * @return {Promise<string>} The ID of the user.
 */
export async function saveOrGetId(email: string): Promise<string> {
  const db = getFirestore();
  const users = await db.collection("users").where("email", "==", email).get();
  if (users.size === 0) {
    // Create a new user
    const newUser = db.collection("users").doc();
    await newUser.set({email});
    return newUser.id;
  } else {
    return users.docs[0].id;
  }
}
