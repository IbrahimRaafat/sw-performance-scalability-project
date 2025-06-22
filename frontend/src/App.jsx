import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import axios from 'axios'
import { Routes, Route, Link, useNavigate } from 'react-router-dom'
import MovieDetail from './components/MovieDetail'

function App() {
  const [count, setCount] = useState(0)
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleSearch = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`/api/movies/search?title=${searchTerm}`);
      setSearchResults(response.data);
    } catch (err) {
      console.error('Error searching for movies:', err);
      setError('Error searching for movies. Please try again.');
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleMovieClick = (tconst) => {
    navigate(`/movies/${tconst}`);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4 text-yellow-500">IMDb Search</h1>

      <Routes>
        <Route path="/" element={
          <>
            <div className="flex space-x-2 mb-4">
              <input
                type="text"
                placeholder="Search for a movie title"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleSearch();
                  }
                }}
                className="border border-gray-700 rounded-md p-2 flex-grow bg-gray-800 text-white focus:outline-none focus:border-yellow-500"
              />
              <button
                onClick={handleSearch}
                disabled={loading}
                className="bg-yellow-500 text-gray-900 rounded-md p-2 hover:bg-yellow-600 disabled:opacity-50 font-semibold"
              >
                {loading ? 'Searching...' : 'Search'}
              </button>
            </div>

            <div className="results-container mt-8">
              <h2 className="text-xl font-semibold mb-2 text-yellow-500">Search Results</h2>
              {loading && <p className="text-gray-400">Loading...</p>}
              {error && <p className="text-red-500">{error}</p>}
              {!loading && !error && searchResults.length === 0 && searchTerm !== '' && (
                 <p className="text-gray-400">No movies found for "{searchTerm}".</p>
              )}
               {!loading && !error && searchResults.length === 0 && searchTerm === '' && (
                 <p className="text-gray-400">Enter a movie title to search.</p>
              )}

              {!loading && !error && searchResults.length > 0 && (
                <ul>
                  {searchResults.map(movie => (
                    <li
                      key={movie.tconst}
                      className="border-b border-gray-700 py-2 text-gray-300 hover:text-yellow-500 cursor-pointer"
                      onClick={() => handleMovieClick(movie.tconst)}
                    >
                      {movie.primaryTitle} ({movie.startYear})
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        } />

        <Route path="/movies/:tconst" element={<MovieDetail />} />

      </Routes>
    </div>
  )
}

export default App
