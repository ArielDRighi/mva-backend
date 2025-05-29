export declare class Cliente {
    clienteId: number;
    nombre: string;
    email: string;
    cuit: string;
    direccion: string;
    telefono: string;
    contacto_principal: string;
    contacto_principal_telefono?: string;
    contactoObra1?: string;
    contacto_obra1_telefono?: string;
    contactoObra2?: string;
    contacto_obra2_telefono?: string;
    fecha_registro: Date;
    estado: string;
    contratos: any[];
    servicios: any[];
    futurasLimpiezas: any[];
}
declare const _default: {
    Cliente: typeof Cliente;
};
export default _default;
