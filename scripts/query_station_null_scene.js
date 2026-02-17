
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log(`Searching for stations with 'scene' as NULL...`);

    const stations = await prisma.station.findMany({
        where: {
            scene: null,
        },
        select: {
            id: true,
            name: true,
            ipAddress: true,
            scene: true
        }
    });

    console.log(`Found ${stations.length} station(s) with NULL scene:`);
    stations.forEach(station => {
        console.log(`- [${station.id}] ${station.name} (IP: ${station.ipAddress})`);
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
