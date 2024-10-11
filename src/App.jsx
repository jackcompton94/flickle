import './App.css'
import { useState } from 'react'

const getFeedback = (key, hints) => {
  const matchGreen = { className: 'match-green', indicator: '' }
  
  switch (key) {
    case 'genres':
      if (hints.genres_hint === true) return matchGreen
      if (hints.genres_hint === 'partial_match') return { className: 'match-yellow' }
      break

    case 'released_year':
      if (hints.released_year_hint === true) return matchGreen
      return {
        className: hints.released_year_hint_plus_minus ? 'match-yellow' : '',
        indicator: hints.released_year_hint === 'lower' ? '⬇️' : '⬆️',
      }
      
    case 'imdb_rating':
      if (hints.imdb_rating_hint === true) return matchGreen
      return {
        className: hints.imdb_rating_hint_plus_minus ? 'match-yellow' : '',
        indicator: hints.imdb_rating_hint === 'lower' ? '⬇️' : '⬆️',
      }

    case 'director':
    case 'star':
      if (hints[key + '_hint'] === true) return matchGreen
      break

    default:
      return { className: '', indicator: '' }
  }
  return { className: '', indicator: '' }
}

const fetchJSON = async (url, options = {}) => {
  try {
    const response = await fetch(url, options)
    if (!response.ok) return null
    return await response.json()
  } catch (error) {
    console.error('Fetch error:', error)
    return null
  }
}

function Movie() {
  const [guessedMovie, setGuessedMovie] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [guessHistory, setGuessHistory] = useState([])
  const [guessedMovieData, setGuessedMovieData] = useState(null)
  
  const keyLabelMapping = {
    title: 'Title',
    genres: 'Genre',
    released_year: 'Released Year',
    imdb_rating: 'IMDb Rating',
    director: 'Director',
    star: 'Star',
  }

  const fetchGuessedMovie = async (guess) => {
    return await fetchJSON(`http://127.0.0.1:5000/guess`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: guess }),
    })
  }

  const fetchSuggestions = async (query) => {
    if (query.length > 1) {
      const data = await fetchJSON(`http://127.0.0.1:5000/suggestions?query=${encodeURIComponent(query)}`)
      setSuggestions(data || [])
    } else {
      setSuggestions([])
    }
  }

  const handleGuess = async (e) => {
    e.preventDefault()
    const data = await fetchGuessedMovie(guessedMovie)

    if (data) {
      // Store the complete movie data for later use
      setGuessedMovieData(data)

      // Filtered guessed movie data
      const filteredGuessedMovie = {
        title: data.title,
        genres: data.genres,
        released_year: data.released_year,
        imdb_rating: data.imdb_rating,
        director: data.director,
        star: data.star,
      }

      const guessedMovieHints = {
        genres_hint: data.genres_hint,
        released_year_hint: data.released_year_hint,
        released_year_hint_plus_minus: data.released_year_hint_plus_minus,
        imdb_rating_hint: data.imdb_rating_hint,
        imdb_rating_hint_plus_minus: data.imdb_rating_hint_plus_minus,
        director_hint: data.director_hint,
        star_hint: data.star_hint,
      }

      // Create an array of feedback metadata
      const feedbackMetadata = Object.entries(filteredGuessedMovie).map(([key, value]) => {
        if (data.is_movie_of_the_day) {
          return { key, value, className: 'match-green' }
        }
        const { className, indicator } = getFeedback(key, guessedMovieHints)
        return { key, value, className, indicator }
      })

      // Prepend the current guessHistory
      setGuessHistory([{ metadata: feedbackMetadata, guessNumber: guessHistory.length + 1 }, ...guessHistory])

      // Reset the guessed movie input and suggestions after a guess
      setGuessedMovie('')
      setSuggestions([])
    }
  }

  const handleInputChange = (e) => {
    const inputValue = e.target.value
    const matchedTitle = suggestions.find(suggestion =>
      suggestion.toLowerCase() === inputValue.toLowerCase()
    )

    setGuessedMovie(matchedTitle || inputValue) // Auto-correct to matching title if found
    fetchSuggestions(inputValue) // Fetch suggestions as user types
  }

  return (
    <div className="movie-container">
      <h1>flickle</h1>
      <form onSubmit={handleGuess} className="search-form">
        <div className="search-input">
          <input
            type="text"
            placeholder="Guess the movie..."
            value={guessedMovie}
            onChange={handleInputChange}
            list="movie-suggestions"
          />
          <datalist id="movie-suggestions">
            {suggestions.map((suggestion, index) => (
              <option key={index} value={suggestion} />
            ))}
          </datalist>
        </div>
      </form>

      {guessedMovieData && guessedMovieData.is_movie_of_the_day && (
        <div className="congratulations">
          <h2>Congratulations! Today's movie is {guessedMovieData.title}</h2>
          <img src={guessedMovieData.poster_link} alt={guessedMovieData.title} style={{ width: '200px', height: 'auto' }} />
        </div>
      )}

      <div className="guess-history">
        {guessHistory.map((guess, index) => (
          <div key={index} className="guessed-movie-metadata">
            <h4>Guess {guess.guessNumber}/10</h4>
            <ul>
              {guess.metadata.map(({ key, value, className, indicator }) => (
                <li key={key} className={className}>
                  <strong>{keyLabelMapping[key]}:</strong> {value} {indicator}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}

function App() {
  return (
    <>
      <Movie />
    </>
  )
}

export default App
