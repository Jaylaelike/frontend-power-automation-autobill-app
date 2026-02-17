
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log(`Checking modbus config for stations with NULL scene...`);

    const stations = await prisma.station.findMany({
        where: {
            scene: null,
        },
        include: {
            modbusConfig: true
        }
    });

    console.log(`Found ${stations.length} station(s) with NULL scene.`);

    let missingConfigCount = 0;
    stations.forEach(station => {
        const hasConfig = !!station.modbusConfig;
        if (!hasConfig) missingConfigCount++;
        console.log(`- [${station.name}] ModbusConfig: ${hasConfig ? 'YES' : 'NO'}`);
        if (hasConfig) {
            console.log(`  Config: ${JSON.stringify(station.modbusConfig)}`);
        }
    });

    console.log(`\nTotal missing modbus config: ${missingConfigCount} / ${stations.length}`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
