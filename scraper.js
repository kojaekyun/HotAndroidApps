const gplay = require('google-play-scraper').default || require('google-play-scraper');

/**
 * Fetches the top 100 free apps from Google Play Store.
 * Filters for ad-supported apps and excludes games/shopping.
 * Optimizes speed by using concurrent batches and early stopping.
 */
async function getTopApps() {
    try {
        console.log('[Scraper] Fetching top free list...');
        const basicResults = await gplay.list({
            collection: gplay.collection.TOP_FREE,
            num: 300,
            lang: 'ko',
            country: 'kr'
        });

        console.log(`[Scraper] Found ${basicResults.length} basic results. Fetching details in batches...`);

        const filteredApps = [];
        const BATCH_SIZE = 15; // Safe concurrency

        for (let i = 0; i < basicResults.length && filteredApps.length < 100; i += BATCH_SIZE) {
            const batch = basicResults.slice(i, i + BATCH_SIZE);
            console.log(`[Scraper] Processing batch ${Math.floor(i / BATCH_SIZE) + 1} (${batch.length} apps)...`);
            
            const details = await Promise.all(
                batch.map(app => gplay.app({ appId: app.appId, lang: 'ko', country: 'kr' }).catch(err => {
                    console.error(`[Scraper] Failed for ${app.appId}: ${err.message}`);
                    return null;
                }))
            );

            for (const app of details) {
                if (!app) continue;
                
                const genre = app.genreId || '';
                const isGame = genre === 'GAME' || genre.startsWith('GAME_');
                const isShopping = genre === 'SHOPPING';
                const isAdSupported = app.adSupported === true;

                if (isAdSupported && !isGame && !isShopping) {
                    filteredApps.push(app);
                    if (filteredApps.length >= 100) break;
                }
            }
            console.log(`[Scraper] Progress: ${filteredApps.length}/100 found.`);
        }

        console.log(`[Scraper] Final count: ${filteredApps.length} apps found.`);

        return filteredApps.slice(0, 100).map((app, index) => ({
            appId: app.appId,
            rank: index + 1,
            name: app.title,
            developer: app.developer,
            category: app.genre || 'General',
            downloads: app.scoreText || (app.score ? 'Rating: ' + app.score.toFixed(1) : 'N/A'),
            icon: app.icon,
            link: app.url || `https://play.google.com/store/apps/details?id=${app.appId}`,
            adSupported: true
        }));
    } catch (error) {
        console.error('[Scraper] FATAL ERROR:', error);
        throw error;
    }
}

module.exports = { getTopApps };
