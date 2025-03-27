import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'client' })
export class Client {
    @PrimaryGeneratedColumn()
    clientId: number;

    @Column()
    name: string;

    @Column()
    email: string;

    @Column()
    cuit: string;

    @Column()
    address: string;

    @Column()
    phone: string;

    @Column()
    mainContact: string;

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })  // Fecha de registro
  registrationDate: Date;

    @Column()
    status: string;

}
