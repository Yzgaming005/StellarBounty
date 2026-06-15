import { AppDataSource } from '../data-source';

async function main(): Promise<void> {
  await AppDataSource.initialize();

  try {
    await AppDataSource.runMigrations({ transaction: 'all' });
    const schemaBuilder = AppDataSource.driver.createSchemaBuilder();
    const schemaDiff = await schemaBuilder.log();

    if (schemaDiff.upQueries.length > 0 || schemaDiff.downQueries.length > 0) {
      console.error('Migrations do not match the current TypeORM entity metadata.');
      console.error('Pending schema changes TypeORM would apply:');
      schemaDiff.upQueries.forEach((query, index) => {
        console.error(`${index + 1}. ${query.query}`);
      });
      process.exitCode = 1;
      return;
    }

    console.log('Database migrations match TypeORM entity metadata.');
  } finally {
    await AppDataSource.destroy();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
