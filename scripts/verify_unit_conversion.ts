
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Verifying conditional unit conversion logic...');

    // 1. Check if we can select scene and modbusConfig properly
    const stations = await prisma.station.findMany({
        select: {
            id: true,
            name: true,
            scene: true,
            modbusConfig: true
        },
        take: 5
    });

    console.log(`Fetched ${stations.length} stations. Sample data:`);
    stations.forEach(s => {
        const isWattUnit = s.scene === null;
        console.log(`- Station: ${s.name}, Scene: ${s.scene}, IsWattUnit: ${isWattUnit}, ModbusConfig: ${s.modbusConfig ? 'OK' : 'MISSING'}`);
    });

    // 2. Simulate the logic update (Visual verification of the logic intended)
    const nullSceneStation = stations.find(s => s.scene === null);
    if (nullSceneStation) {
        console.log(`\nTest Case: Station with scene NULL (${nullSceneStation.name})`);
        console.log(`- Original Value (Wh): 73992466`);
        const divisor = nullSceneStation.scene === null ? 1000 : 1;
        console.log(`- Divisor Applied: ${divisor}`);
        console.log(`- Calculated Value (kW): ${73992466 / divisor}`);
        console.log(`- Expected: 73992.466 (approx 73992.47)`);
    }

    const nonNullSceneStation = stations.find(s => s.scene !== null);
    if (nonNullSceneStation) {
        console.log(`\nTest Case: Station with scene "${nonNullSceneStation.scene}" (${nonNullSceneStation.name})`);
        console.log(`- Original Value (kW): 12345.67`);
        const divisor = nonNullSceneStation.scene === null ? 1000 : 1;
        console.log(`- Divisor Applied: ${divisor}`);
        console.log(`- Calculated Value (kW): ${12345.67 / divisor}`);
        console.log(`- Expected: 12345.67`);
    }

}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
