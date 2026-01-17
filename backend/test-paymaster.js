import BlockchainService from './src/services/blockchain.js';
import dotenv from 'dotenv';
dotenv.config();

async function main() {
    console.log('Testing Gasless Transaction Setup...');

    if (!process.env.PAYMASTER_URL) {
        console.error('❌ PAYMASTER_URL is missing in .env');
    } else {
        console.log('✅ PAYMASTER_URL is present');
    }

    if (!process.env.OPERATOR_PRIVATE_KEY) {
        console.error('❌ OPERATOR_PRIVATE_KEY is missing in .env');
    } else {
        console.log('✅ OPERATOR_PRIVATE_KEY is present');
    }

    console.log('Initializing service...');
    // Force initialization wait
    await new Promise(resolve => setTimeout(resolve, 3000));

    if (BlockchainService.smartAccountClient) {
        console.log(`✅ Smart Account initialized! Address: ${BlockchainService.smartAccountAddress}`);
        console.log('Paymaster integration appears correctly configured.');
    } else {
        console.log('❌ Smart Account NOT initialized. Check logs above.');
        console.log('Note: If PAYMASTER_URL is missing, this is expected behavior (fallback to EOA).');
    }
}

main().catch(console.error).finally(() => process.exit());
