
const { sdk } = require('./frame/node_modules/@farcaster/miniapp-sdk/dist/index.js');

console.log('SDK Keys:', Object.keys(sdk));
if (sdk.actions) {
    console.log('SDK Actions:', Object.keys(sdk.actions));
}
if (sdk.wallet) {
    console.log('SDK Wallet:', Object.keys(sdk.wallet));
}
// Check for provider
console.log('Has provider?', !!sdk.provider);
