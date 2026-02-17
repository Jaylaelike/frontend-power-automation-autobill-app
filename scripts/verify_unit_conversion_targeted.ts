
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Targeted verification for "scene: null" stations...');

    // Target specific stations known to have scene: null
    const targetNames = ["สมุทรสงคราม", "ชัยบาดาล", "น่าน"];

    const stations = await prisma.station.findMany({
        where: {
            name: { in: targetNames }
        },
        select: {
            id: true,
            name: true,
            scene: true,
            modbusConfig: true
        }
    });

    console.log(`Fetched ${stations.length} stations.`);
    stations.forEach(s => {
        const isWattUnit = s.scene === null;
        const divisor = isWattUnit ? 1000 : 1;

        console.log(`\nStation: ${s.name}`);
        console.log(`- Scene: ${s.scene} (${s.scene === null ? 'NULL' : 'NOT NULL'})`);
        console.log(`- IsWattUnit: ${isWattUnit}`);
        console.log(`- Divisor: ${divisor}`);

        if (s.name === "สมุทรสงคราม") {
            console.log(`- Test Calculation: 73992466 / ${divisor} = ${73992466 / divisor} (Expected 73992.466)`);
        } else if (s.name === "น่าน") {
            console.log(`- Test Calculation: 12345 / ${divisor} = ${12345 / divisor} (Expected 12345)`);
        }
    });
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
