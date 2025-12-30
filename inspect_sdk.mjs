
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pkg = require('./frame/node_modules/@farcaster/miniapp-sdk/dist/index.js');

console.log('--- Top Level ---');
Object.keys(pkg).forEach(k => console.log(k));

if (pkg.sdk) {
    console.log('--- SDK Keys ---');
    Object.keys(pkg.sdk).forEach(k => console.log(k));
    if (pkg.sdk.wallet) {
        console.log('ethProvider type:', typeof pkg.sdk.wallet.ethProvider);
        console.log('getEthereumProvider type:', typeof pkg.sdk.wallet.getEthereumProvider);
    }
}
