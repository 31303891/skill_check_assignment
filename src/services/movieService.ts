import axios from 'axios';
import { endpoints } from '../config/api';
import { Movie, MovieDetails } from '../types/movie';

export const movieService = {
  searchMovies: async (query: string): Promise<{ results: Movie[] }> => {
    const response = await axios.get(endpoints.search(query));
    return response.data;
  },

  getMovieDetails: async (movieId: string): Promise<MovieDetails> => {
    const response = await axios.get(endpoints.movieDetails(movieId));
    return response.data;
  },

  getPopularMovies: async (): Promise<{ results: Movie[] }> => {
    const response = await axios.get(endpoints.popular);
    return response.data;
  },

  getTopRatedMovies: async (): Promise<{ results: Movie[] }> => {
    const response = await axios.get(endpoints.topRated);
    return response.data;
  },

  getNowPlayingMovies: async (): Promise<{ results: Movie[] }> => {
    const response = await axios.get(endpoints.nowPlaying);
    return response.data;
  },

  getUpcomingMovies: async (): Promise<{ results: Movie[] }> => {
    const response = await axios.get(endpoints.upcoming);
    return response.data;
  },
}; 