const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const cron = require('node-cron');
const { DateTime } = require('luxon');
const { getTopApps } = require('./scraper');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

// Path for storing historical data
const HISTORY_FILE = path.join(__dirname, 'data', 'history.json');

// Ensure history file exists
if (!fs.existsSync(path.join(__dirname, 'data'))) {
    fs.mkdirSync(path.join(__dirname, 'data'), { recursive: true });
}
if (!fs.existsSync(HISTORY_FILE)) {
    fs.writeFileSync(HISTORY_FILE, JSON.stringify({}));
}

// Function to calculate rank changes and save history
async function runDailyBatch() {
    const today = DateTime.now().setZone('Asia/Seoul').toFormat('yyyy-MM-dd');
    const yesterday = DateTime.now().setZone('Asia/Seoul').minus({ days: 1 }).toFormat('yyyy-MM-dd');

    console.log(`[Batch] Running for ${today}...`);
    try {
        const currentBatch = await getTopApps();

        // Read history
        let history = JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8'));
        const yesterdayBatch = history[yesterday];

        // Process current batch with differences
        const processedBatch = currentBatch.map(app => {
            let change = null;
            let status = 'new'; // Default if not found yesterday

            if (yesterdayBatch) {
                const prevApp = yesterdayBatch.find(a => a.appId === app.appId);
                if (prevApp) {
                    change = prevApp.rank - app.rank; // was 10, now 5 => +5
                    status = (change === 0) ? 'stable' : (change > 0 ? 'up' : 'down');
                }
            }

            // Flag for surge/plummet (>= 10 or <= -10)
            let isSurge = change !== null && change >= 10;
            let isPlummet = change !== null && change <= -10;

            return { ...app, change, status, isSurge, isPlummet };
        });

        // Store in history
        history[today] = processedBatch;

        // Keep only last 30 days of history to avoid bloating
        const dates = Object.keys(history).sort();
        if (dates.length > 30) {
            delete history[dates[0]];
        }

        fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2));
        console.log(`[Batch] ${today} data saved. ${processedBatch.length} apps processed.`);
        return processedBatch;
    } catch (e) {
        console.error('[Batch] Failed:', e.message);
        throw e;
    }
}

// Schedule: KST 00:00 (Every day)
cron.schedule('0 0 * * *', async () => {
    console.log('[Cron] Midnight task triggered (KST)');
    await runDailyBatch();
}, {
    timezone: "Asia/Seoul"
});

// API endpoint to get the latest ranking data
app.get('/apps', async (req, res) => {
    try {
        const today = DateTime.now().setZone('Asia/Seoul').toFormat('yyyy-MM-dd');
        const history = JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8'));

        // If today's data doesn't exist yet, run or return latest available
        if (!history[today]) {
            console.log(`Today's data (${today}) not found. Running batch now...`);
            const newData = await runDailyBatch();
            return res.json({ apps: newData, date: today });
        }

        res.json({ apps: history[today], date: today });
    } catch (error) {
        console.error('SERVER ERROR:', error.message);
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server started on http://localhost:${PORT}`);
    console.log('Daily batch scheduled for 00:00 KST');
});
