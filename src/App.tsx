import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AppBar, Toolbar, Typography, Container, Box, Fab } from '@mui/material';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import { Home } from './pages/Home';
import { Search } from './components/Search';

function App() {
  const [searchQuery, setSearchQuery] = useState('');

  const handleScrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  return (
    <Router>
      <Box sx={{ position: 'relative' }}>
        <AppBar position="static">
          <Toolbar>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              Movie Database
            </Typography>
          </Toolbar>
        </AppBar>
        <Box
          sx={{
            position: 'absolute',
            top: -30,
            right: { xs: 16, sm: 24 },
            zIndex: 1100,
            width: { xs: '100%', sm: 300 }
          }}
        >
          <Search onSearch={setSearchQuery} />
        </Box>
      </Box>
      <Container sx={{ mt: 8 }}>
        <Routes>
          <Route path="/movie/:movieId" element={<Home searchQuery={searchQuery} />} />
          <Route path="/" element={<Home searchQuery={searchQuery} />} />
        </Routes>
      </Container>
      <Fab
        color="primary"
        size="small"
        onClick={handleScrollToTop}
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 16,
          zIndex: 1000
        }}
      >
        <KeyboardArrowUpIcon />
      </Fab>
    </Router>
  );
}

export default App;
