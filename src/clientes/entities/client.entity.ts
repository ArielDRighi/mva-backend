import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'cliente' })
export class Cliente {
    @PrimaryGeneratedColumn()
    clienteId: number;

    @Column()
    nombre: string;

    @Column()
    email: string;

    @Column()
    cuit: string;

    @Column()
    direccion: string;

    @Column()
    telefono: string;

    @Column()
    contacto_principal: string;

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })  // Fecha de registro
    fecha_registro: Date;

    @Column()
    estado: string;

}
