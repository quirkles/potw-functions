import "reflect-metadata";

import {logger} from "firebase-functions";
import {DataSource} from "typeorm";

import {D} from "@mobily/ts-belt";

import {getConfig} from "../config";
import {
  PostgresConnectionOptions,
} from "typeorm/driver/postgres/PostgresConnectionOptions";
import {Entities} from "./entities";


let dataSource: DataSource;

export function getDataSource(configOverrides: Partial<PostgresConnectionOptions> = {}): DataSource {
  if (dataSource) {
    logger.info("Returning existing data source");
    return dataSource;
  }
  const {sqlDatabase, env} = getConfig();
  const {
    host,
    user,
    password,
    dbName,
    port,
  } = sqlDatabase;

  logger.info(`Creating data source for ${env} environment`);

  const options = {
    type: "postgres",
    host: host,
    port,
    username: user,
    password: password,
    database: dbName,
    entities: Object.values(Entities),
    migrations: ["./migrations/*.{t|j}s"],
    synchronize: false,
    logging: false,
  };

  const optionsWithOverrides: PostgresConnectionOptions = D.merge(options, configOverrides);
  logger.info(`Data source options: ${JSON.stringify(optionsWithOverrides)}`);
  dataSource = new DataSource(optionsWithOverrides);
  return dataSource;
}
