
async function checkStats() {
    try {
        const url = 'https://auto-yield-1.onrender.com/api/stats';
        const res = await fetch(url);
        if (res.ok) {
            const data = await res.json();
            console.log('APY:', data.vault?.apy);
        } else {
            console.log('Error:', res.status);
        }
    } catch (e) {
        console.log('Unreachable:', e.message);
    }
}
checkStats();
