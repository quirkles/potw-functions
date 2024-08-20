import {randomBytes} from "crypto";

import {getFirestore} from "firebase-admin/firestore";

import {getLogger} from "../../../functionWrapper";
import {sendInviteToEmail} from "../../email/invite";
import {makeId} from "../../utils/string";

export async function getIdFromSqlId(sqlId: string): Promise<string | null> {
  const db = getFirestore();
  const users = await db.collection("users").where("sqlId", "==", sqlId).get();
  if (users.size === 0) {
    return null;
  } else if (users.size > 1) {
    throw new Error("Multiple users found with the same sqlId");
  }
  return users.docs[0].id;
}

/**
 * This function checks if a user with the given email exists in the Firestore database.
 * If the user exists, it returns the user's ID.
 * If the user does not exist, it creates a new user with the given email and returns the new user's ID.
 *
 * @param {string} email - The email of the user.
 * @param {boolean} needsVerification - Does the user require verification?
 * Oauth methods do not require verification, email login does.
 * @return {Promise<string>} The ID of the user.
 */
export async function saveOrGetId(
  email: string,
  needsVerification = false
): Promise<string> {
  const db = getFirestore();
  const users = await db.collection("users").where("email", "==", email).get();
  if (users.size === 0) {
    // Create a new user
    const newUser = db.collection("users").doc();
    await newUser.set({email, verified: !needsVerification, createdAt: new Date(), updatedAt: new Date()});
    return newUser.id;
  } else {
    return users.docs[0].id;
  }
}

export async function inviteOrGetId(
  email: string,
  invitor: string
): Promise<string> {
  const logger = getLogger();
  logger.info("inviteOrGetId: begin", {
    email,
    invitor,
  });
  const db = getFirestore();
  const users = await db.collection("users").where("email", "==", email).get();
  if (users.size === 0) {
    // Create a new user and invite them
    const newUser = db.collection("users").doc();
    logger.info("inviteOrGetId: creating new user", {
      newUser: newUser.id,
    });
    await Promise.all([
      newUser.set({email, verified: false, createdAt: new Date(), updatedAt: new Date()}),
      sendInviteToEmail(email, invitor).catch((error) => {
        logger.error("Error sending invite email", {email, invitor, error});
      }),
    ]);
    return newUser.id;
  } else {
    logger.info("inviteOrGetId: user already exists");
    return users.docs[0].id;
  }
}
/**
 * Creates a one-time password (OTP) for the given email and invalidates any existing OTPs for the same email.
 *
 * @param {string} id - The firestore id for the user.
 * @param {string} email - The email for which to create the OTP.
 * @return {Promise<string>} A Promise that resolves to the otp.
 * @throws {Error} If there's an error while creating the OTP or invalidating existing OTPs.
 */
export async function createOtp(id: string, email: string): Promise<{
    otp: string;
    codeVerifier: string;
}> {
  const db = getFirestore();
  const otpDoc = db.collection("otp").doc();
  const existingOtpForEmailQuery = db.collection("otp").where("email", "==", email);
  await db.runTransaction(async (t) => {
    const existingOtp = await existingOtpForEmailQuery.get();
    await Promise.all(
      existingOtp.docs.map((doc) => {
        t.update(doc.ref, {valid: false});
      })
    );
  });

  const otp = makeId();
  const codeVerifier = randomBytes(64).toString("hex");
  await otpDoc.set({
    email,
    userId: id,
    otp,
    codeVerifier,
    createdAt: new Date(),
    used: false,
    valid: true,
  });
  return {
    otp,
    codeVerifier,
  };
}

/**
 * Verifies an OTP (One-Time Password) and its associated code verifier.
 *
 * @param {string} otp - The OTP to verify.
 * @param {string} codeVerifier - The code verifier associated with the OTP.
 * @return {Promise<boolean>} A Promise that resolves to a boolean.
 * Indicates whether the OTP and code verifier are valid and unused.
 * @throws {Error} If there's an error while verifying the OTP and code verifier.
 */
export async function verifyOtp(otp: string, codeVerifier: string): Promise<string | Error> {
  const db = getFirestore();
  const logger = getLogger();
  logger.info(`otp: ${otp}, codeVerifier: ${codeVerifier}`);
  const otpQuery = db.collection("otp")
    .where("otp", "==", otp)
    .where("codeVerifier", "==", codeVerifier)
    .where("valid", "==", true)
    .where("used", "==", false);
  const otpDocs = await otpQuery.get();
  logger.info(`otpDocs found: ${otpDocs.size}`);
  if (otpDocs.size === 1) {
    const otpDoc = otpDocs.docs[0];
    await otpDoc.ref.update({used: true, valid: false});
    const {email, userId} = otpDoc.data();
    await db.collection("users").doc(userId).update({verified: true});
    return email;
  }
  if (otpDocs.size > 1) {
    return new Error("Unexpected number of OTPs found");
  }
  return new Error("Invalid OTP");
}

export async function setField(id: string, field: string, value: string): Promise<void> {
  const db = getFirestore();
  const user = db.collection("users").doc(id);
  await user.update({[field]: value});
}
