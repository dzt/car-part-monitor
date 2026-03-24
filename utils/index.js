// Helper function to prevent all requests from running concurently
export const runSequential = async (tasks, delay = 500) => {
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

export default { runSequential }