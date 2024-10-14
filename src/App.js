import {useEffect, useRef, useState} from "react";
import icon from './icon.jpg';
import imdbIcon from './imdb.png';
import StarRating from './StarRating'

const average = (arr) =>
    arr.reduce((acc, cur, i, arr) => acc + cur / arr.length, 0);

const KEY = `3ca7bbfc`;

export default function App() {

    const [movies, setMovies] = useState([]);
    const [watched, setWatched] = useState(function () {
        const storedValue = localStorage.getItem('watched')
        return JSON.parse(storedValue);
    });
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

    function handelAddWatchedMovie(movie) {
        setWatched(cur => [...cur, movie]);
        handelCloseMovie();
    }

    function handelRemoveWatchedMovie(id) {
        setWatched((cur) => cur.filter(el => el.id !== id));
    }


    useEffect(
        () => {
            localStorage.setItem('watched', JSON.stringify(watched))
        }, [watched]);

    useEffect(() => {
            const controller = new AbortController();

            async function fetchMovies() {
                try {
                    setIsLoading(true);
                    setError('');

                    const res = await fetch(`http://www.omdbapi.com/?apikey=${KEY}&s=${query}`,
                        {signal: controller.signal}
                    );


                    if (!res.ok)
                        throw new Error();


                    const data = await res.json();

                    if (data.Response === "False")
                        throw new Error('Movie not found');

                    setMovies(data.Search);
                    setError('');


                } catch (err) {
                    if (err.name !== 'AbortError') {
                        setError(err.message);
                    }
                } finally {
                    setIsLoading(false);
                }


            }

            if (query.length < 3) {
                setMovies([]);
                setError('');
                return;
            }
            fetchMovies();
            return () => controller.abort();
        }, [query]
    );

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
                            ? <MovieDetails
                                selectedId={selectedId}
                                onCloseMovie={handelCloseMovie}
                                onAddWatched={handelAddWatchedMovie}
                                watched={watched}
                            />
                            : <>
                                <Summary watched={watched}/>
                                <WatchedList
                                    watched={watched}
                                    onRemoveMovie={handelRemoveWatchedMovie}
                                />
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
    const searchEl = useRef(null);

    useEffect(function () {
        function callBack(e) {
            if(document.activeElement ===searchEl.current)return
            if (e.key === 'Enter') {
                searchEl.current.focus();
                setQuery('');
            }
        }

        document.addEventListener('keydown', callBack);
        return document.addEventListener('keydown', callBack);

    }, [setQuery])

    return (
        <input
            className="search"
            type="text"
            placeholder="Search movies..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            ref={searchEl}
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

function MovieDetails({selectedId, onCloseMovie, onAddWatched, watched}) {

    const [movie, setMovie] = useState({});
    const [userRating, setUserRating] = useState(null);
    const [isLoading, setIsLoading] = useState(false);


    useEffect(() => {
        setIsLoading(true);

        async function fetchMovieDetails() {
            const res = await fetch(
                `http://www.omdbapi.com/?apikey=${KEY}&i=${selectedId}`
            );
            const data = await res.json();
            setMovie(data);
            setIsLoading(false);
        }

        fetchMovieDetails()
    }, [selectedId]);

    const {
        Title: title,
        Year: year,
        Poster: poster,
        Runtime: runTime,
        Plot: plot,
        Released: released,
        Actors: actors,
        Director: director,
        Genre: genre,
        imdbRating
    } = movie


    function handelAdd() {

        const newWatchedMovie = {
            id: selectedId,
            title,
            poster,
            year,
            ...(isNaN(Number(imdbRating)) ? {} : {imdbRating}),
            ...(isNaN(Number(runTime.split(' ')[0]))
                ? {}
                : {runTime: Number(runTime.split(' ')[0])}),
            userRating
        };

        onAddWatched(newWatchedMovie)

    }

    useEffect(() => {
        function callBack(e) {

            if (e.key === 'Escape') {
                onCloseMovie();
            }
        }

        document.addEventListener('keydown', callBack)
        return () => document.removeEventListener('keydown', callBack)

    }, [onCloseMovie]);

    const alreadyWatched = watched.some((cur) => cur.id === movie.imdbID);

    useEffect(() => {
        if (!title) return;
        document.title = `Movie | ${title}`;

        return () => {
            document.title = 'RateReel'
        };
    }, [title]);


    return (
        <div className={'details'}>
            {isLoading && <Loader/>}
            {!isLoading &&
                <>
                    <header>
                        <button
                            className={'btn-back'}
                            onClick={onCloseMovie}
                        >&larr;
                        </button>
                        <img src={poster} alt={`poster of ${title} movie`}/>
                        <div className={'details-overview'}>
                            <h2>{title}</h2>
                            <p>{released} &bull; {runTime}</p>
                            <p>{genre}</p>
                            <p>
                                <span><img src={imdbIcon} className={'logo imdb-icon'} alt={'imdb logo'}/></span>
                                {imdbRating}
                            </p>
                        </div>
                    </header>
                    <section>
                        <div className={'rating'}>
                            {
                                !alreadyWatched
                                    ?
                                    <>
                                        <StarRating size={24} maxRating={10} onRate={setUserRating}/>
                                        {
                                            (userRating > 0) && (
                                                <button
                                                    className={'btn-add'}
                                                    onClick={handelAdd}
                                                >+ Add to list
                                                </button>)}
                                    </>
                                    :
                                    <p>🌟Rated by : {watched.find(el => el.id === movie.imdbID).userRating} </p>

                            }
                        </div>
                        <p>
                            <em>{plot}</em>
                        </p>
                        <p>Directed by {director}</p>
                        <p>Starring: {actors}</p>


                    </section>
                </>
            }

        </div>
    );

}

function WatchedList({watched, onRemoveMovie}) {

    return (
        <ul className="list">
            {watched.map((el) => (
                <WatchedMovie movieItem={el} key={el.id} onRemoveMovie={onRemoveMovie}/>
            ))}
        </ul>
    )
}

function WatchedMovie({movieItem, onRemoveMovie}) {
    return (
        <li key={movieItem.id}>
            <img src={movieItem.poster} alt={`${movieItem.title} poster`}/>
            <h3>{movieItem.title}</h3>
            <div>
                <p>
                    <span>⭐️</span>
                    <span>{isNaN(movieItem.imdbRating) ? 0 : movieItem.imdbRating}</span>
                </p>
                <p>
                    <span>🌟</span>
                    <span>{movieItem.userRating}</span>
                </p>
                <p>
                    <span>⏳</span>
                    <span>{movieItem.runTime} min</span>
                </p>
                <button className={'btn-delete'} onClick={() => onRemoveMovie(movieItem.id)}>❌</button>
            </div>
        </li>
    )
}

function Summary({watched}) {

    const moviesWithImdbRating = watched.filter(el => el.imdbRating !== undefined);

    const avgImdbRating = (average(moviesWithImdbRating.map((el) => el?.imdbRating)));
    const avgUserRating = (average(watched.map((el) => el.userRating)));

    const moviesWithRunTime = watched.filter(el => el.runTime !== undefined);

    const avgRuntime = (average(moviesWithRunTime.map((el) => el?.runTime)));
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
                    <span>{avgImdbRating.toFixed(2)}</span>
                </p>
                <p>
                    <span>🌟</span>
                    <span>{avgUserRating.toFixed(2)}</span>
                </p>
                <p>
                    <span>⏳</span>
                    <span>{avgRuntime.toFixed(2)} min</span>
                </p>
            </div>
        </div>
    )
}
