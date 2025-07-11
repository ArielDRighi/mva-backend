import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddFamilyMembers1751037933275 implements MigrationInterface {
  name = 'AddFamilyMembers1751037933275';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Crear tabla family_members
    await queryRunner.query(`
            CREATE TABLE "family_members" (
                "id" SERIAL NOT NULL,
                "nombre" character varying(100) NOT NULL,
                "apellido" character varying(100) NOT NULL,
                "parentesco" character varying(50) NOT NULL,
                "dni" character varying(20) NOT NULL,
                "fecha_nacimiento" date NOT NULL,
                "empleado_id" integer,
                CONSTRAINT "PK_family_members_id" PRIMARY KEY ("id")
            )
        `);

    // Crear foreign key constraint
    await queryRunner.query(`
            ALTER TABLE "family_members" 
            ADD CONSTRAINT "FK_family_members_empleado" 
            FOREIGN KEY ("empleado_id") 
            REFERENCES "employees"("empleado_id") 
            ON DELETE CASCADE 
            ON UPDATE CASCADE
        `);

    // Crear índice para mejorar performance
    await queryRunner.query(`
            CREATE INDEX "IDX_family_members_empleado" 
            ON "family_members" ("empleado_id")
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Eliminar índice
    await queryRunner.query(`DROP INDEX "IDX_family_members_empleado"`);

    // Eliminar foreign key constraint
    await queryRunner.query(
      `ALTER TABLE "family_members" DROP CONSTRAINT "FK_family_members_empleado"`,
    );

    // Eliminar tabla
    await queryRunner.query(`DROP TABLE "family_members"`);
  }
}
