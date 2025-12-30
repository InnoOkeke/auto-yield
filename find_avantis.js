
import https from 'https';

https.get('https://yields.llama.fi/pools', (resp) => {
    let data = '';

    resp.on('data', (chunk) => {
        data += chunk;
    });

    resp.on('end', () => {
        resp.on('end', async () => {
            try {
                const json = JSON.parse(data);
                const avantisPools = json.data.filter(p =>
                    p.project.toLowerCase().includes('avantis') &&
                    p.symbol === 'USDC'
                );
                const fs = await import('fs');
                avantisPools.forEach(p => {
                    const out = `Symbol: ${p.symbol}, Chain: ${p.chain}, APY: ${p.apy}, ID: ${p.pool}\n`;
                    console.log(out);
                    fs.writeFileSync('avantis_id.txt', out, { flag: 'a' }); // Added { flag: 'a' } to append
                });
            } catch (e) {
                console.error(e);
            }
        });

    }).on("error", (err) => {
        console.log("Error: " + err.message);
    });
