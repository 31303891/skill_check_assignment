import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Grid,
  Chip,
  Paper,
  CircularProgress,
  IconButton,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { MovieDetails as MovieDetailsType } from '../types/movie';
import { movieService } from '../services/movieService';
import { IMAGE_BASE_URL } from '../config/api';

export const MovieDetails: React.FC = () => {
  const { movieId } = useParams<{ movieId: string }>();
  const navigate = useNavigate();
  const [movie, setMovie] = useState<MovieDetailsType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMovieDetails = async () => {
      if (!movieId) return;
      try {
        const data = await movieService.getMovieDetails(movieId);
        setMovie(data);
      } catch (error) {
        console.error('Error fetching movie details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMovieDetails();
  }, [movieId]);

  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
        <CircularProgress />
      </Container>
    );
  }

  if (!movie) {
    return (
      <Container>
        <Typography>Movie not found</Typography>
      </Container>
    );
  }

  return (
    <Paper sx={{ mb: 4, position: 'relative' }}>
      <IconButton
        onClick={() => navigate('/')}
        sx={{ position: 'absolute', right: 8, top: 8, zIndex: 1 }}
      >
        <CloseIcon />
      </IconButton>
      <Container>
        <Box sx={{ py: 2 }}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={3}>
              <img
                src={`${IMAGE_BASE_URL}/w500${movie.poster_path}`}
                alt={movie.title}
                style={{ width: '100%', borderRadius: '8px' }}
              />
            </Grid>
            <Grid item xs={12} md={9}>
              <Typography variant="h5" component="h1" gutterBottom>
                {movie.title}
              </Typography>
              <Box sx={{ mb: 1 }}>
                {movie.genres.map((genre) => (
                  <Chip
                    key={genre.id}
                    label={genre.name}
                    size="small"
                    sx={{ mr: 1, mb: 1 }}
                  />
                ))}
              </Box>
              <Typography variant="body2" color="text.secondary" paragraph>
                {movie.overview}
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6} sm={3}>
                  <Typography variant="caption" color="text.secondary" display="block">
                    Release Date
                  </Typography>
                  <Typography variant="body2">
                    {new Date(movie.release_date).toLocaleDateString()}
                  </Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="caption" color="text.secondary" display="block">
                    Rating
                  </Typography>
                  <Typography variant="body2">
                    {movie.vote_average.toFixed(1)}/10
                  </Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="caption" color="text.secondary" display="block">
                    Runtime
                  </Typography>
                  <Typography variant="body2">{movie.runtime} min</Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="caption" color="text.secondary" display="block">
                    Budget
                  </Typography>
                  <Typography variant="body2">
                    ${(movie.budget / 1000000).toFixed(1)}M
                  </Typography>
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </Box>
      </Container>
    </Paper>
  );
}; 