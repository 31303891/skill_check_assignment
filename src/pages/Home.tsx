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
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { Movie, MovieDetails as MovieDetailsType } from '../types/movie';
import { MovieCard } from '../components/MovieCard';
import { movieService } from '../services/movieService';
import { IMAGE_BASE_URL } from '../config/api';

export const Home: React.FC = () => {
  const { movieId } = useParams<{ movieId: string }>();
  const navigate = useNavigate();
  const [popularMovies, setPopularMovies] = useState<Movie[]>([]);
  const [topRatedMovies, setTopRatedMovies] = useState<Movie[]>([]);
  const [selectedMovie, setSelectedMovie] = useState<MovieDetailsType | null>(null);
  const [loading, setLoading] = useState(true);

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
        <Paper sx={{ mb: 4, position: 'relative' }}>
          <IconButton
            onClick={() => navigate('/')}
            sx={{ position: 'absolute', right: 8, top: 8, zIndex: 1 }}
          >
            <CloseIcon />
          </IconButton>
          <Box sx={{ py: 2 }}>
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
                    <Typography variant="body2">
                      {selectedMovie.vote_average.toFixed(1)}/10
                    </Typography>
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

      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Popular Movies
        </Typography>
        <Grid container spacing={3}>
          {popularMovies.map((movie) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={movie.id}>
              <MovieCard movie={movie} />
            </Grid>
          ))}
        </Grid>
      </Box>

      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h2" gutterBottom>
          Top Rated Movies
        </Typography>
        <Grid container spacing={3}>
          {topRatedMovies.map((movie) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={movie.id}>
              <MovieCard movie={movie} />
            </Grid>
          ))}
        </Grid>
      </Box>
    </Container>
  );
}; 