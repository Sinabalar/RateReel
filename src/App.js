import {useEffect, useState} from "react";
import icon from './icon.jpg';

const average = (arr) =>
    arr.reduce((acc, cur, i, arr) => acc + cur / arr.length, 0);

const KEY = `3ca7bbfc`;

export default function App() {

    const [movies, setMovies] = useState([]);
    const [watched, setWatched] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [query, setQuery] = useState('');
    const [selectedId, setSelectedId] = useState(null);


    function handelSelectMovie(id) {
        setSelectedId((currId) => id === currId ? null : id)

    }

    function handelCloseMovie() {
        setSelectedId(null)

    }

    useEffect(() => {
            async function fetchMovies() {
                try {
                    setIsLoading(true);
                    setError('');

                    const res = await fetch(`http://www.omdbapi.com/?apikey=${KEY}&s=${query}`);

                    if (!res.ok)
                        throw new Error();


                    const data = await res.json();

                    if (data.Response === "False")
                        throw new Error('Movie not found');

                    setMovies(data.Search);

                } catch (err) {
                    setError(err.message)
                } finally {
                    setIsLoading(false);
                }


            }

            if (query.length < 3) {
                setMovies([]);
                setError('');
                return;
            }
            fetchMovies()
        }, [query]
    )

    return (
        <div>
            <Nav>
                <SearchBar query={query} setQuery={setQuery}/>
                <NumResults movies={movies}/>
            </Nav>
            <Main>
                <Box>
                    {isLoading && <Loader/>}
                    {error && <ErrorMessage message={error}/>}
                    {
                        !isLoading
                        &&
                        !error
                        &&
                        <MovieList
                            movies={movies}
                            onSelect={handelSelectMovie}
                        />
                    }
                </Box>
                <Box>
                    {
                        selectedId
                            ? <MovieDetails selectedId={selectedId}
                                            onCloseMovie={handelCloseMovie}
                            />
                            : <>
                                <Summary watched={watched}/>
                                <WatchedList watched={watched}/>
                            </>


                    }
                </Box>
            </Main>
        </div>
    )
}

function Nav({children}) {

    return (
        <nav className="nav-bar">
            <Logo/>
            {children}
        </nav>
    )
}

function Logo() {
    return (
        <div className="logo">
            <img src={icon} alt="icon"/>
            <h1>RateReel</h1>
        </div>
    )
}

function SearchBar({query, setQuery}) {

    return (
        <input
            className="search"
            type="text"
            placeholder="Search movies..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
        />
    )
}

function NumResults({movies = []}) {
    return (
        <p className="num-results">
            Found <strong>{movies.length}</strong> results
        </p>
    )
}


function Main({children}) {
    return (
        <main className="main">
            {children}
        </main>
    );
}

function Box({children}) {
    const [isOpen, setIsOpen] = useState(true);
    return (
        <div className="box">
            <button
                className="btn-toggle"
                onClick={() => setIsOpen((open) => !open)}
            >
                {isOpen ? "–" : "+"}
            </button>
            {isOpen && (children)}
        </div>
    )
}


function MovieList({movies, onSelect}) {
    return (
        <ul className="list list-movies">
            {
                movies?.map((el) =>
                    <Movie
                        key={el.imdbID}
                        movieItem={el}
                        onSelect={onSelect}
                    />
                )
            }
        </ul>
    )
}

function Movie({movieItem, onSelect}) {
    return (

        <li onClick={() => onSelect(movieItem.imdbID)}>
            <img src={movieItem.Poster} alt={`${movieItem.Title} poster`}/>
            <h3>{movieItem.Title}</h3>
            <div>
                <p>
                    <span>🗓</span>
                    <span>{movieItem.Year}</span>
                </p>
            </div>
        </li>
    )

}

function Loader() {
    return (
        <p className={'loader'}>Loading...</p>
    );

}

function ErrorMessage({message}) {
    return (
        <p className={'error'}>
            {
                message === 'Failed to fetch'
                    ? "Please check your internet connection !"
                    : message
            }
        </p>
    )
}

function MovieDetails({selectedId, onCloseMovie}) {
    return (
        <div className={'details'}>
            <button
                className={'btn-back'}
                onClick={onCloseMovie}
            >&larr;
            </button>
            {selectedId}
        </div>
    );

}

function WatchedList({watched}) {

    return (
        <ul className="list">
            {watched.map((movie) => (
                <li key={movie.imdbID}>
                    <img src={movie.Poster} alt={`${movie.Title} poster`}/>
                    <h3>{movie.Title}</h3>
                    <div>
                        <p>
                            <span>⭐️</span>
                            <span>{movie.imdbRating}</span>
                        </p>
                        <p>
                            <span>🌟</span>
                            <span>{movie.userRating}</span>
                        </p>
                        <p>
                            <span>⏳</span>
                            <span>{movie.runtime} min</span>
                        </p>
                    </div>
                </li>
            ))}
        </ul>
    )
}

function Summary({watched}) {
    const avgImdbRating = average(watched.map((movie) => movie.imdbRating));
    const avgUserRating = average(watched.map((movie) => movie.userRating));
    const avgRuntime = average(watched.map((movie) => movie.runtime));
    return (
        <div className="summary">
            <h2>Movies you watched</h2>
            <div>
                <p>
                    <span>#️⃣</span>
                    <span>{watched.length} movies</span>
                </p>
                <p>
                    <span>⭐️</span>
                    <span>{avgImdbRating}</span>
                </p>
                <p>
                    <span>🌟</span>
                    <span>{avgUserRating}</span>
                </p>
                <p>
                    <span>⏳</span>
                    <span>{avgRuntime} min</span>
                </p>
            </div>
        </div>
    )
}
