import {Logging} from "@google-cloud/logging";
import {projectID} from "firebase-functions/params";
import build from "pino-abstract-transport";

export default function(opts: {
    logName: string;
}) {
  const LoggingInstance = new Logging({
    projectId: projectID.value(),
  });
  const log = LoggingInstance.log(opts.logName);
  console.log("gcpTransport: created transport for log", opts.logName, projectID.value());
  let writeCount = 0;
  return build(async function(source) {
    source.on("data", async (data) => {
      const {
        "logging.googleapis.com/labels": labels,
        ...rest
      } = data;
      const logEntry = {
        labels,
        ...rest,
      };
      writeCount++;
      console.log("gcpTransport: writing log entry", logEntry);
      await log.write(logEntry).catch((err) => {
        console.error("gcpTransport: error writing log entry", err);
      }).finally(() => {
        writeCount--;
      });
    });
  }, {
    expectPinoConfig: true,
    close: async () => {
      while (writeCount > 0) {
        await new Promise((resolve) => {
          setTimeout(resolve, 100);
        });
      }
      console.log("gcpTransport: closing transport");
      return;
    },
  });
}
