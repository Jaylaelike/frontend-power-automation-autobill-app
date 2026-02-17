
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const pattern = "http://10.1.8.36/data";
    console.log(`Searching for stations with ipAddress containing: "${pattern}"`);

    const stations = await prisma.station.findMany({
        where: {
            ipAddress: {
                contains: pattern,
            },
        },
        select: {
            id: true,
            name: true,
            ipAddress: true
        }
    });

    console.log(`Found ${stations.length} station(s):`);
    stations.forEach(station => {
        console.log(`- [${station.id}] ${station.name}: ${station.ipAddress}`);
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
