import React from 'react';
import { Card, CardContent, CardMedia, Typography, CardActionArea } from '@mui/material';
import { Movie } from '../types/movie';
import { IMAGE_BASE_URL } from '../config/api';
import { useNavigate } from 'react-router-dom';

interface MovieCardProps {
  movie: Movie;
}

export const MovieCard: React.FC<MovieCardProps> = ({ movie }) => {
  const navigate = useNavigate();

  return (
    <Card sx={{ maxWidth: 345, height: '100%' }}>
      <CardActionArea onClick={() => navigate(`/movie/${movie.id}`)}>
        <CardMedia
          component="img"
          height="500"
          image={`${IMAGE_BASE_URL}/w500${movie.poster_path}`}
          alt={movie.title}
        />
        <CardContent>
          <Typography gutterBottom variant="h6" component="div" noWrap>
            {movie.title}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {new Date(movie.release_date).getFullYear()}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Rating: {movie.vote_average.toFixed(1)}/10
          </Typography>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}; 