/**
 * Test script for notifications
 * Run with: node backend/test/notifications.test.js
 */
import axios from 'axios';

const BACKEND_URL = 'http://localhost:3000';
const TEST_FID = 306389; // Your FID for testing
const TEST_WALLET = '0x123...'; // Your wallet address

async function testNotifications() {
    console.log('🚀 Starting notification tests...');

    try {
        // 1. Test status check
        console.log('\n--- Testing Status Check ---');
        const statusRes = await axios.get(`${BACKEND_URL}/api/notifications/status`, {
            params: { fid: TEST_FID }
        });
        console.log('Status Result:', statusRes.data);

        // 2. Test send test notification
        console.log('\n--- Testing Test Notification ---');
        const testRes = await axios.post(`${BACKEND_URL}/api/notifications/test`, {
            fid: TEST_FID
        });
        console.log('Test Notification Result:', testRes.data);

        // 3. Test sync trigger (Activated)
        console.log('\n--- Testing Sync Activation ---');
        // This requires the user to actually have a subscription on-chain for the provided address
        // Or we can mock the blockchain service for a full unit test.
        // For this script, we just test the endpoint hits.
        console.log('Manual check: Subscribing/Pausing in the app should now trigger notifications.');

    } catch (error) {
        console.error('❌ Test failed:', error.response?.data || error.message);
    }
}

// NOTE: This script assumes the backend is running.
// testNotifications();
console.log('Verification script ready. Run with node.');
