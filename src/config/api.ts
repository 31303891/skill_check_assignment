export const API_KEY = process.env.REACT_APP_TMDB_API_KEY || '';
export const BASE_URL = 'https://api.themoviedb.org/3';
export const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p';

export const endpoints = {
  search: (query: string) => `${BASE_URL}/search/movie?api_key=${API_KEY}&query=${query}`,
  movieDetails: (movieId: string) => `${BASE_URL}/movie/${movieId}?api_key=${API_KEY}`,
  popular: `${BASE_URL}/movie/popular?api_key=${API_KEY}`,
  topRated: `${BASE_URL}/movie/top_rated?api_key=${API_KEY}`,
  nowPlaying: `${BASE_URL}/movie/now_playing?api_key=${API_KEY}`,
  upcoming: `${BASE_URL}/movie/upcoming?api_key=${API_KEY}`,
}; 