
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log(`Checking modbus config for a valid station...`);

    const station = await prisma.station.findFirst({
        where: {
            modbusConfig: {
                isNot: null
            }
        },
        include: {
            modbusConfig: true
        }
    });

    if (station) {
        console.log(`Found station: ${station.name}`);
        console.log(`Config: ${JSON.stringify(station.modbusConfig, null, 2)}`);
    } else {
        console.log("No station with modbus config found.");
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
