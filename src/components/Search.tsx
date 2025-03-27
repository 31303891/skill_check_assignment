import React, { useState } from 'react';
import {
  TextField,
  InputAdornment,
  IconButton,
  Box,
  Typography,
  Grid,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { Movie } from '../types/movie';
import { movieService } from '../services/movieService';
import { MovieCard } from './MovieCard';

export const Search: React.FC = () => {
  const [query, setQuery] = useState('');
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    try {
      const response = await movieService.searchMovies(query);
      setMovies(response.results);
    } catch (error) {
      console.error('Error searching movies:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ my: 4 }}>
      <form onSubmit={handleSearch}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search movies..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton type="submit" edge="end">
                  <SearchIcon />
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
      </form>

      {loading ? (
        <Typography sx={{ my: 4 }}>Searching...</Typography>
      ) : movies.length > 0 ? (
        <Grid container spacing={3} sx={{ mt: 2 }}>
          {movies.map((movie) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={movie.id}>
              <MovieCard movie={movie} />
            </Grid>
          ))}
        </Grid>
      ) : query ? (
        <Typography sx={{ my: 4 }}>No movies found</Typography>
      ) : null}
    </Box>
  );
}; 