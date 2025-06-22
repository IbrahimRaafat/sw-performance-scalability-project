const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// MongoDB Connection URL (Use the same as in server.js)
const mongoURI = 'mongodb://admin:password123@localhost:27017/IMDB?authSource=admin';

// Define Mongoose Schemas (Need minimal schemas for ratings and basics)
const titleRatingSchema = new mongoose.Schema({
    tconst: String,
    numVotes: Number,
});
const TitleRating = mongoose.model('TitleRating', titleRatingSchema, 'title.ratings');

const titleBasicSchema = new mongoose.Schema({
    tconst: String,
    primaryTitle: String,
});
const TitleBasic = mongoose.model('TitleBasic', titleBasicSchema, 'title.basics');

async function generateQuerySet() {
  try {
    await mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('MongoDB connected...');

    console.log('Fetching ratings data...');
    // Fetch all ratings data, only getting tconst and numVotes
    const ratings = await TitleRating.find({}, { tconst: 1, numVotes: 1, _id: 0 });
    console.log(`Fetched ${ratings.length} rating entries.`);

    // Calculate total number of votes and prepare data for sampling
    let totalVotes = 0;
    const movieWeights = [];

    for (const rating of ratings) {
        if (rating.numVotes > 0) { // Only consider movies with votes
            totalVotes += rating.numVotes;
            movieWeights.push({ tconst: rating.tconst, weight: rating.numVotes });
        }
    }
    console.log(`Total votes across relevant movies: ${totalVotes}`);
    console.log(`Prepared ${movieWeights.length} movies for sampling.`);

    // --- Sampling logic (Roulette Wheel Selection) ---
    const querySetSize = 10000;
    const sampledTconsts = new Set(); // Use Set to ensure uniqueness
    const querySet = new Set(); // Store final titles

    console.log(`Sampling movie tconsts until we have ${querySetSize} valid titles...`);

    while (querySet.size < querySetSize) {
        // Sample a new batch of tconsts
        while (sampledTconsts.size < Math.min(querySetSize * 2, movieWeights.length)) {
            let randomWeight = Math.random() * totalVotes;
            let cumulativeWeight = 0;
            for (const movie of movieWeights) {
                cumulativeWeight += movie.weight;
                if (randomWeight < cumulativeWeight) {
                    sampledTconsts.add(movie.tconst);
                    break;
                }
            }
        }

        // Fetch titles for the sampled tconsts
        console.log(`Fetching titles for ${sampledTconsts.size} sampled tconsts...`);
        const sampledMovies = await TitleBasic.find(
            { tconst: { $in: Array.from(sampledTconsts) } },
            { primaryTitle: 1, _id: 0 }
        );

        // Add new titles to the query set
        for (const movie of sampledMovies) {
            if (querySet.size < querySetSize) {
                querySet.add(movie.primaryTitle);
            }
        }

        console.log(`Current progress: ${querySet.size} valid titles out of ${querySetSize} requested`);

        // If we still need more titles, clear the sampled tconsts and continue
        if (querySet.size < querySetSize) {
            sampledTconsts.clear();
        }
    }

    // Define the output file path
    const outputFilePath = path.join(__dirname, 'query_set.txt');

    // Save the query set to a text file (one title per line)
    fs.writeFileSync(outputFilePath, Array.from(querySet).join('\n'), 'utf-8');

    console.log(`Successfully saved ${querySet.size} unique movie titles to ${outputFilePath}`);

  } catch (err) {
    console.error('Error generating query set:', err);
  } finally {
    mongoose.disconnect();
    console.log('MongoDB disconnected.');
  }
}

generateQuerySet(); 