import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUsers1709953226630 implements MigrationInterface {
    name = 'AddUsers1709953226630'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "user" ("id" SERIAL NOT NULL, "username" character varying NOT NULL, "email" character varying(100) NOT NULL, "firestoreId" character varying NOT NULL, CONSTRAINT "UQ_78a916df40e02a9deb1c4b75edb" UNIQUE ("username"), CONSTRAINT "UQ_ef08dbb89a357461d32f5f8fb20" UNIQUE ("firestoreId"), CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "user"`);
    }

}
