import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AppBar, Toolbar, Typography, Container, Box } from '@mui/material';
import { Home } from './pages/Home';
import { Search } from './components/Search';

function App() {
  return (
    <Router>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Movie Database
          </Typography>
        </Toolbar>
      </AppBar>
      <Container>
        <Box sx={{ position: 'relative' }}>
          <Search />
          <Routes>
            <Route path="/movie/:movieId" element={<Home />} />
            <Route path="/" element={<Home />} />
          </Routes>
        </Box>
      </Container>
    </Router>
  );
}

export default App;
