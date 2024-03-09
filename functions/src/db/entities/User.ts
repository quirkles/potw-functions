import {Entity, Column, PrimaryGeneratedColumn} from "typeorm";

@Entity()
export class User {
    @PrimaryGeneratedColumn()
      id!: number;

    @Column({unique: true})
      username!: string;

    @Column({
      length: 50,
    })
      email!: string;

    @Column({unique: true})
      firestoreId!: string;
}
