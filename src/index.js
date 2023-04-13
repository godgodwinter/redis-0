const express = require('express');
const redis = require('redis');
const axios = require('axios'); // 👈 new code
const app = express();
const port = 3000;

// REDIS INITIALITATION
const redisClient = redis.createClient({ url: 'redis://localhost:6379', password: 'yourpass' });
(async () => {
    redisClient.on("error", (error) => console.error(`Ups : ${error}`));
    await redisClient.connect();
})();
// REDIS

// * Updated code WITH REDIS
async function fetchToDos(completed) {
    const cacheKey = `TODOS_C_${completed}`;

    // First attempt to retrieve data from the cache
    try {
        const cachedResult = await redisClient.get(cacheKey);
        if (cachedResult) {
            console.log('Data from cache.');
            return cachedResult;
        }
    } catch (error) {
        console.error('Something happened to Redis', error);
    }

    // If the cache is empty or we fail reading it, default back to the API
    const apiResponse = await axios(`https://jsonplaceholder.typicode.com/todos?completed=${completed}`);
    console.log('Data requested from the ToDo API.');

    // Finally, if you got any results, save the data back to the cache
    if (apiResponse.data.length > 0) {
        try {
            await redisClient.set(
                cacheKey,
                JSON.stringify(apiResponse.data),
                { EX: 120 } // Set the specified expire time, in seconds.
            ); // 👈 updated code
        } catch (error) {
            console.error('Something happened to Redis', error);
        }
    }

    return apiResponse.data;
}
// * Updated code WITH REDIS-END


// ! tanpa REDIS

// async function fetchToDos(completed) {
//     const apiResponse = await axios(`https://jsonplaceholder.typicode.com/todos?completed=${completed}`);
//     console.log('Data requested from the ToDo API.');
//     return apiResponse.data;
// }
// ! tanpa REDIS-END




app.get('/', async (req, res) => {
    res.send(await fetchToDos(req.query.completed)); // 👈 updated code
});

app.listen(port, () => {
    console.log(`NodeJS loves Redis listening on port ${port}`);
});