
import https from 'https';

console.log('Fetching...');
https.get('https://yields.llama.fi/pools', (resp) => {
    let data = '';
    resp.on('data', chunk => data += chunk);
    resp.on('end', () => {
        try {
            const json = JSON.parse(data);
            const pool = json.data.find(p =>
                p.project.toLowerCase().includes('avantis') &&
                p.symbol === 'USDC' &&
                p.chain === 'Base'
            );
            if (pool) {
                console.log(`FOUND_ID:${pool.pool}`);
                console.log(`CURRENT_APY:${pool.apy}`);
            } else {
                console.log('NOT_FOUND');
            }
        } catch (e) {
            console.error(e);
        }
    });
}).on("error", (err) => console.log("Error: " + err.message));
