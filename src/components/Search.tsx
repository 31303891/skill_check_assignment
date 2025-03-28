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

interface SearchProps {
  onSearch: (query: string) => void;
}

export const Search: React.FC<SearchProps> = ({ onSearch }) => {
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
          placeholder="Search movie title..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            onSearch(e.target.value);
          }}
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
    </Box>
  );
}; 