import {getLogger} from "../../functionWrapper/functionWrapper";

async function initializeStore(): Promise<Record<string, string>> {
  const logger = getLogger();
  logger.debug("initializeStore(): begin");
  await new Promise((resolve) => setTimeout(resolve, 1000));
  return {
    url: "https://example.com",
    username: "admin",
    password: "password",
  };
}

export async function getUser(): Promise<Record<string, string>> {
  const logger = getLogger();
  logger.debug("getUser(): begin");
  const store = await initializeStore();
  logger.debug("getUser(): store", store);
  return {
    username: store.username,
    password: store.password,
  };
}
