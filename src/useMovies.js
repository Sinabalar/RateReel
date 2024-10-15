import {useState, useEffect} from "react";


const KEY = `3ca7bbfc`;

export function useMovies(query) {


    const [movies, setMovies] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
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
                    setIsLoading(false)
                    if (err.name !== 'AbortError') {
                        setError(err.message);
                    }
                } finally {
                    setIsLoading(false)
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
    return {movies, isLoading, error};
}