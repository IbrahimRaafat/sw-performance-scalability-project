const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// Define Mongoose Schemas based on your data structure
const nameBasicSchema = new mongoose.Schema({
  nconst: String,
  primaryName: String,
  birthYear: Number,
  deathYear: mongoose.Schema.Types.Mixed, // Handle \\N or number
  primaryProfession: String,
  knownForTitles: String, // Still a string with comma-separated tconsts
});
const NameBasic = mongoose.model('NameBasic', nameBasicSchema, 'name.basics'); // Use your actual collection name

const titleBasicSchema = new mongoose.Schema({
  tconst: String,
  titleType: String,
  primaryTitle: String,
  originalTitle: String,
  isAdult: Number,
  startYear: Number,
  endYear: mongoose.Schema.Types.Mixed, // Handle \\N or number
  runtimeMinutes: mongoose.Schema.Types.Mixed, // Handle \\N or number
  genres: String, // Still a string with comma-separated genres
});
const TitleBasic = mongoose.model('TitleBasic', titleBasicSchema, 'title.basics'); // Use your actual collection name

const titlePrincipalSchema = new mongoose.Schema({
    tconst: String,
    ordering: Number,
    nconst: String,
    category: String,
    job: mongoose.Schema.Types.Mixed, // Handle \\N or string
    characters: mongoose.Schema.Types.Mixed // Handle \\N or stringified array
});
const TitlePrincipal = mongoose.model('TitlePrincipal', titlePrincipalSchema, 'title.principals'); // Use your actual collection name


const titleRatingSchema = new mongoose.Schema({
    tconst: String,
    averageRating: Number,
    numVotes: Number,
});
const TitleRating = mongoose.model('TitleRating', titleRatingSchema, 'title.ratings'); // Use your actual collection name


const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json()); // for parsing application/json

// MongoDB Connection URL
// Use environment variable if available (Docker), fallback to localhost for local dev
const mongoURI = process.env.MONGO_URI || 'mongodb://admin:password123@localhost:27017/IMDB?authSource=admin';
console.log('MongoDB URI:', mongoURI);
mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(async () => {
    console.log('MongoDB connected...');
    // Create indexes if they don't exist
    try {
      await TitleBasic.collection.createIndex({ primaryTitle: "text" }); // Text index for searching
      await TitleBasic.collection.createIndex({ tconst: 1 });
      await TitleBasic.collection.createIndex({ titleType: 1 });
      await TitleRating.collection.createIndex({ tconst: 1 });
      await TitlePrincipal.collection.createIndex({ tconst: 1 });
      await TitlePrincipal.collection.createIndex({ nconst: 1 });
      await NameBasic.collection.createIndex({ nconst: 1 });
      await NameBasic.collection.createIndex({ primaryName: "text" }); // Optional: Text index for name search
      console.log('Indexes created successfully.');
    } catch (indexErr) {
      // Ignore if indexes already exist
      if (indexErr.code !== 48) { // Error code 48 means index already exists
        console.error('Error creating indexes:', indexErr);
      }
    }
  })
  .catch(err => console.error(err));

// Basic Route
app.get('/', (req, res) => {
  res.send('IMDb Search Backend is running!');
});

// API Endpoints

// Search movies by title
app.get('/api/movies/search', async (req, res) => {
  console.log('Received search request:', req.query.title);
  try {
    const searchTerm = req.query.title;
    if (!searchTerm) {
      return res.status(400).json({ message: 'Search term is required' });
    }

    // Escape special characters in the search term for regex
    const escapedSearchTerm = searchTerm.replace(/[.*+?^${}()|\[\]\\]/g, '\$&');

    // Use a case-insensitive regex for searching movie titles that contain the search term
    const movies = await TitleBasic.find(
      { primaryTitle: { $regex: escapedSearchTerm, $options: 'i' }, titleType: 'movie' }
    ).limit(5);

    res.json(movies);
  } catch (err) {
    console.error('Error searching for movies:', err);
    res.status(500).json({ message: err.message });
  }
});

// Get movie details by tconst
app.get('/api/movies/:tconst', async (req, res) => {
  try {
    const tconst = req.params.tconst;

    // Fetch movie details from title.basics
    const movieDetails = await TitleBasic.findOne({ tconst: tconst });

    if (!movieDetails) {
      return res.status(404).json({ message: 'Movie not found' });
    }

    // Fetch rating from title.ratings
    const movieRating = await TitleRating.findOne({ tconst: tconst });

    // Fetch principals from title.principals
    const moviePrincipals = await TitlePrincipal.find({ tconst: tconst });

    // Get nconsts of principals to fetch their names
    const principalNconsts = moviePrincipals.map(p => p.nconst);

    // Fetch principal names from name.basics
    const principalDetails = await NameBasic.find(
      { nconst: { $in: principalNconsts } },
      { nconst: 1, primaryName: 1, primaryProfession: 1 } // Project necessary fields
    );

    // Combine the data
    const fullDetails = {
      ...movieDetails.toJSON(),
      rating: movieRating ? movieRating.toJSON() : null,
      principals: moviePrincipals.map(principal => {
        const details = principalDetails.find(d => d.nconst === principal.nconst);
        return {
          ...principal.toJSON(),
          nameDetails: details ? details.toJSON() : null
        };
      })
    };

    res.json(fullDetails);

  } catch (err) {
    console.error('Error fetching movie details:', err);
    res.status(500).json({ message: err.message });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
}); 