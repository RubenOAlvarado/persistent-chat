import path from 'path';
import Hypercore from 'hypercore';
import Hyperswarm from 'hyperswarm';
import os from 'os';

const swarm = new Hyperswarm();
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

async function shutdown(){
    console.log('shutting down...');
    try {
        await swarm.destroy();
        console.log('Shutdown complete.');
    } catch (error) {
        console.error(`Error during shutdown: ${error}`);
        process.exit(0);
    }
}

const storagePath = path.join(os.homedir(), '.hypercore', 'reader-storage');
const core = new Hypercore(storagePath, process.argv[2]);
await core.ready();

const foundPeers = core.findingPeers();
swarm.join(core.discoveryKey);
swarm.on('connection', conn => core.replicate(conn));

swarm.flush().then(() => foundPeers());

await core.update();

let position = core.length;
console.log(`Skipping ${core.length} earlier blocks...`);
for await (const block of core.createReadStream({ start: core.length, live: true })){
    console.log(`Block ${position++}: ${block}`);
}