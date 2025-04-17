import path from "path";
import os from "os";
import Hyperswarm from "hyperswarm";
import Hypercore from "hypercore";
import b4a from "b4a";

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

const storagePath = path.join(os.homedir(), ".hypercore", "writer-storage");
const core = new Hypercore(storagePath, { valueEncoding: "utf-8" });

await core.ready();
console.log('hypercore key: ', b4a.toString(core.key, 'hex'));

process.stdin.on('data', data => core.append(data));

swarm.join(core.discoveryKey);
swarm.on('connection', conn => core.replicate(conn));

