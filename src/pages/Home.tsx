import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Grid,
  Box,
  Chip,
  Paper,
  CircularProgress,
  IconButton,
  Button,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { Movie, MovieDetails as MovieDetailsType } from '../types/movie';
import { MovieCard } from '../components/MovieCard';
import { movieService } from '../services/movieService';
import { IMAGE_BASE_URL } from '../config/api';
import StarIcon from '@mui/icons-material/Star';

interface HomeProps {
  searchQuery: string;
}

export const Home: React.FC<HomeProps> = ({ searchQuery }) => {
  const { movieId } = useParams<{ movieId: string }>();
  const navigate = useNavigate();
  const [popularMovies, setPopularMovies] = useState<Movie[]>([]);
  const [topRatedMovies, setTopRatedMovies] = useState<Movie[]>([]);
  const [selectedMovie, setSelectedMovie] = useState<MovieDetailsType | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchResults, setSearchResults] = useState<Movie[]>([]);

  const handleClose = () => {
    setSelectedMovie(null);
    navigate('/');
  };

  useEffect(() => {
    const fetchMovies = async () => {
      try {
        const [popularResponse, topRatedResponse] = await Promise.all([
          movieService.getPopularMovies(),
          movieService.getTopRatedMovies(),
        ]);
        setPopularMovies(popularResponse.results);
        setTopRatedMovies(topRatedResponse.results);
      } catch (error) {
        console.error('Error fetching movies:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMovies();
  }, []);

  useEffect(() => {
    const fetchMovieDetails = async () => {
      if (!movieId) return;
      try {
        const data = await movieService.getMovieDetails(movieId);
        setSelectedMovie(data);
      } catch (error) {
        console.error('Error fetching movie details:', error);
      }
    };

    fetchMovieDetails();
  }, [movieId]);

  useEffect(() => {
    const searchMovies = async () => {
      if (!searchQuery) {
        setSearchResults([]);
        return;
      }
      try {
        const results = await movieService.searchMovies(searchQuery);
        setSearchResults(results.results);
      } catch (error) {
        console.error('Error searching movies:', error);
      }
    };

    searchMovies();
  }, [searchQuery]);

  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container>
      {selectedMovie && (
        <Paper
          sx={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '90%',
            maxWidth: '1200px',
            maxHeight: '90vh',
            overflow: 'auto',
            zIndex: 1000,
            boxShadow: 24,
          }}
        >
          <IconButton
            onClick={handleClose}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              zIndex: 1,
              bgcolor: 'background.paper',
              '&:hover': {
                bgcolor: 'action.hover',
              },
            }}
          >
            <CloseIcon />
          </IconButton>
          <Box sx={{ p: 3 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={3}>
                <img
                  src={`${IMAGE_BASE_URL}/w500${selectedMovie.poster_path}`}
                  alt={selectedMovie.title}
                  style={{ width: '100%', borderRadius: '8px' }}
                />
              </Grid>
              <Grid item xs={12} md={9}>
                <Typography variant="h5" component="h1" gutterBottom>
                  {selectedMovie.title}
                </Typography>
                <Box sx={{ mb: 1 }}>
                  {selectedMovie.genres.map((genre) => (
                    <Chip
                      key={genre.id}
                      label={genre.name}
                      size="small"
                      sx={{ mr: 1, mb: 1 }}
                    />
                  ))}
                </Box>
                <Typography variant="body2" color="text.secondary" paragraph>
                  {selectedMovie.overview}
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="caption" color="text.secondary" display="block">
                      Release Date
                    </Typography>
                    <Typography variant="body2">
                      {new Date(selectedMovie.release_date).toLocaleDateString()}
                    </Typography>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="caption" color="text.secondary" display="block">
                      Rating
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <StarIcon sx={{ color: '#FFB400', fontSize: '1.2rem' }} />
                      <Typography variant="body2">
                        {selectedMovie.vote_average.toFixed(1)}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="caption" color="text.secondary" display="block">
                      Runtime
                    </Typography>
                    <Typography variant="body2">{selectedMovie.runtime} min</Typography>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="caption" color="text.secondary" display="block">
                      Budget
                    </Typography>
                    <Typography variant="body2">
                      ${(selectedMovie.budget / 1000000).toFixed(1)}M
                    </Typography>
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          </Box>
        </Paper>
      )}
      {selectedMovie && (
        <Box
          sx={{
            position: 'fixed',
            bgcolor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 999,
          }}
          onClick={handleClose}
        />
      )}

      {searchQuery ? (
        <Box sx={{ my: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
            <Button
              variant="outlined"
              onClick={() => window.location.reload()}
              sx={{ mb: 2 }}
            >
              Home
            </Button>
          </Box>
          <Typography variant="h4" component="h1" gutterBottom align="center">
            Search Results
          </Typography>
          {searchResults.length > 0 ? (
            <Box
              sx={{
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'center',
                margin: -1.5,
              }}
            >
              {searchResults.map((movie) => (
                <Box
                  key={movie.id}
                  sx={{
                    width: { xs: '100%', sm: '30%', md: '25%', lg: '20%' },
                    padding: 1.5,
                  }}
                >
                  <MovieCard movie={movie} />
                </Box>
              ))}
            </Box>
          ) : (
            <Typography variant="h6" align="center" color="text.secondary" sx={{ mt: 4 }}>
              No movies found for "{searchQuery}"
            </Typography>
          )}
        </Box>
      ) : (
        <>
          <Box sx={{ my: 4 }}>
            <Typography variant="h4" component="h1" gutterBottom>
              Popular Movies
            </Typography>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                flexWrap: 'wrap',
                margin: -1.5,
              }}
            >
              {popularMovies.map((movie) => (
                <Box
                  key={movie.id}
                  sx={{
                    width: { xs: '100%', sm: '30%', md: '25%', lg: '20%' },
                    padding: 1.5,
                  }}
                >
                  <MovieCard movie={movie} />
                </Box>
              ))}
            </Box>
          </Box>

          <Box sx={{ my: 4 }}>
            <Typography variant="h4" component="h2" gutterBottom>
              Top Rated Movies
            </Typography>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                flexWrap: 'wrap',
                margin: -1.5,
              }}
            >
              {topRatedMovies.map((movie) => (
                <Box
                  key={movie.id}
                  sx={{
                    width: { xs: '100%', sm: '30%', md: '25%', lg: '20%' },
                    padding: 1.5,
                  }}
                >
                  <MovieCard movie={movie} />
                </Box>
              ))}
            </Box>
          </Box>
        </>
      )}
    </Container>
  );
}; 