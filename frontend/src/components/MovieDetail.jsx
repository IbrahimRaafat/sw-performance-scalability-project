import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';

function MovieDetail() {
  const { tconst } = useParams(); // Get tconst from URL parameter
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMovieDetails = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await axios.get(`http://localhost:3000/api/movies/${tconst}`);
        setMovie(response.data);
      } catch (err) {
        console.error('Error fetching movie details:', err);
        setError('Error fetching movie details. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (tconst) {
      fetchMovieDetails();
    }
  }, [tconst]); // Re-run effect if tconst changes

  if (loading) {
    return <div className="text-gray-400">Loading movie details...</div>;
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  if (!movie) {
    return <div className="text-gray-400">Movie details not found.</div>;
  }

  // Display movie details (basic structure for now)
  return (
    <div className="movie-detail-container bg-gray-800 p-6 rounded-md shadow-lg">
      <Link to="/" className="text-yellow-500 hover:underline mb-4 inline-block">&larr; Back to Search</Link>
      <h2 className="text-2xl font-bold mb-4 text-yellow-500">{movie.primaryTitle} ({movie.startYear})</h2>
      
      <p className="text-gray-300 mb-2"><strong>Runtime:</strong> {movie.runtimeMinutes} minutes</p>
      <p className="text-gray-300 mb-2"><strong>Genres:</strong> {movie.genres}</p>

      {movie.rating && (
        <p className="text-gray-300 mb-2"><strong>Rating:</strong> {movie.rating.averageRating} ({movie.rating.numVotes} votes)</p>
      )}

      {movie.principals && movie.principals.length > 0 && (
        <div className="mt-4">
          <h3 className="text-xl font-semibold mb-2 text-yellow-500">Principals:</h3>
          <ul>
            {movie.principals.map(principal => (
              <li key={principal.nconst} className="text-gray-300 mb-1">
                <strong>{principal.nameDetails?.primaryName || 'N/A'}</strong> - {principal.category} ({principal.nameDetails?.primaryProfession || 'N/A'})
              </li>
            ))}
          </ul>
        </div>
      )}

    </div>
  );
}

export default MovieDetail; 