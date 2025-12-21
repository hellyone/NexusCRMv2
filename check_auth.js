
const urls = ['http://localhost:3000/', 'http://localhost:3000/finance'];

async function check() {
    for (const url of urls) {
        try {
            const res = await fetch(url, { redirect: 'manual' });
            console.log(`URL: ${url}`);
            console.log(`Status: ${res.status}`);
            console.log(`Location: ${res.headers.get('location')}`);
            console.log('---');
        } catch (e) {
            console.error(`Error fetching ${url}:`, e.message);
        }
    }
}

check();
