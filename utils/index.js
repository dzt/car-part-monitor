// Helper function to prevent all requests from running concurently
async function runSequential(tasks, delay = 500) {
    const results = [];
    for (const task of tasks) {
        try {
            const value = await task();
            results.push({ status: 'fulfilled', value });
        } catch (err) {
            results.push({ status: 'rejected', reason: err });
        }

        await new Promise(r => setTimeout(r, delay));
    }
    return results;
}

module.exports = { runSequential }