import './App.css';
import bountytutorLogo from './assets/bountytutor-logo.png';
import { PLATFORMS } from './platforms.js';
import { useState, useEffect } from 'react';
import LearningModule from './components/LearningModule.jsx';
import {
  Box,
  Paper,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Container,
} from '@mui/material';

function App() {
  const [platform, setPlatform] = useState('');
  const [category, setCategory] = useState('');
  const [vrtOptions, setVrtOptions] = useState([]);
  const [bugcrowdCategories, setBugcrowdCategories] = useState([]);
  const [bugcrowdCategory, setBugcrowdCategory] = useState('');
  const [bugcrowdSubcategories, setBugcrowdSubcategories] = useState([]);
  const [bugcrowdSubcategory, setBugcrowdSubcategory] = useState('');
  const [bugcrowdVariants, setBugcrowdVariants] = useState([]);
  const [bugcrowdVariant, setBugcrowdVariant] = useState('');

  useEffect(() => {
    const selected = PLATFORMS.find((p) => p.key === platform);
    setVrtOptions(selected ? selected.categories : []);
    setCategory('');
  }, [platform]);

  // Load Bugcrowd VRT JSON dynamically when platform is bugcrowd
  useEffect(() => {
    if (platform === 'bugcrowd') {
      fetch('/bugcrowd-vrt.json')
        .then(res => res.json())
        .then(data => {
          setBugcrowdCategories(data.content || []);
        });
      setBugcrowdCategory('');
      setBugcrowdSubcategory('');
      setBugcrowdVariant('');
      setBugcrowdSubcategories([]);
      setBugcrowdVariants([]);
    } else {
      setBugcrowdCategories([]);
      setBugcrowdCategory('');
      setBugcrowdSubcategory('');
      setBugcrowdVariant('');
      setBugcrowdSubcategories([]);
      setBugcrowdVariants([]);
    }
  }, [platform]);

  // When Bugcrowd category changes, update subcategories
  useEffect(() => {
    if (platform === 'bugcrowd' && bugcrowdCategory) {
      const cat = bugcrowdCategories.find(c => c.name === bugcrowdCategory);
      setBugcrowdSubcategories(cat?.children || []);
      setBugcrowdSubcategory('');
      setBugcrowdVariant('');
      setBugcrowdVariants([]);
    }
  }, [platform, bugcrowdCategory, bugcrowdCategories]);

  // When Bugcrowd subcategory changes, update variants and handle 2-tier case
  useEffect(() => {
    if (platform === 'bugcrowd' && bugcrowdSubcategory) {
      const cat = bugcrowdCategories.find(c => c.name === bugcrowdCategory);
      const subcat = cat?.children?.find(s => s.name === bugcrowdSubcategory);
      setBugcrowdVariants(subcat?.children || []);
      setBugcrowdVariant('');
      if (!subcat?.children || subcat.children.length === 0) {
        setCategory(`${bugcrowdCategory} > ${bugcrowdSubcategory}`);
      }
    }
  }, [platform, bugcrowdCategory, bugcrowdSubcategory, bugcrowdCategories]);

  // When Bugcrowd variant changes, set the main category state to the full path
  useEffect(() => {
    if (
      platform === 'bugcrowd' &&
      bugcrowdCategory &&
      bugcrowdSubcategory &&
      bugcrowdVariant
    ) {
      setCategory(`${bugcrowdCategory} > ${bugcrowdSubcategory} > ${bugcrowdVariant}`);
    }
  }, [platform, bugcrowdCategory, bugcrowdSubcategory, bugcrowdVariant]);

  return (
    <Container maxWidth="md" sx={{ pt: 4, minHeight: '100vh' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <img src={bountytutorLogo} alt="BountyTutor Logo" style={{ width: 72, marginRight: 20 }} />
        <Typography variant="h4" sx={{ fontWeight: 700 }}>BountyTutor</Typography>
      </Box>
      <Typography variant="body1" paragraph>
        Learn about bug bounty vulnerabilities interactively. Select a platform and category to get started!
      </Typography>
      <Paper elevation={4} sx={{ p: { xs: 2, sm: 4 }, borderRadius: 3, boxShadow: 6, width: '100%', mb: 4 }}>
        <FormControl fullWidth sx={{ mb: 3 }}>
          <InputLabel id="platform-label">Platform</InputLabel>
          <Select
            labelId="platform-label"
            value={platform}
            label="Platform"
            onChange={(e) => setPlatform(e.target.value)}
          >
            {PLATFORMS.map((p) => (
              <MenuItem key={p.key} value={p.key}>{p.label}</MenuItem>
            ))}
          </Select>
        </FormControl>
        {platform === 'bugcrowd' && (
          <>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel id="bugcrowd-category-label">Category</InputLabel>
              <Select
                labelId="bugcrowd-category-label"
                value={bugcrowdCategory}
                label="Category"
                onChange={e => setBugcrowdCategory(e.target.value)}
              >
                {bugcrowdCategories.map(cat => (
                  <MenuItem key={cat.id} value={cat.name}>{cat.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
            {bugcrowdSubcategories.length > 0 && (
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel id="bugcrowd-subcategory-label">Subcategory</InputLabel>
                <Select
                  labelId="bugcrowd-subcategory-label"
                  value={bugcrowdSubcategory}
                  label="Subcategory"
                  onChange={e => setBugcrowdSubcategory(e.target.value)}
                >
                  {bugcrowdSubcategories.map(subcat => (
                    <MenuItem key={subcat.id} value={subcat.name}>{subcat.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
            {bugcrowdVariants.length > 0 && (
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel id="bugcrowd-variant-label">Variant / Affected Function</InputLabel>
                <Select
                  labelId="bugcrowd-variant-label"
                  value={bugcrowdVariant}
                  label="Variant / Affected Function"
                  onChange={e => setBugcrowdVariant(e.target.value)}
                >
                  {bugcrowdVariants.map(variant => (
                    <MenuItem key={variant.id} value={variant.name}>{variant.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          </>
        )}
        {(platform === 'hackerone' || platform === 'google') && (
          <FormControl fullWidth>
            <InputLabel id="vrt-label">VRT Category</InputLabel>
            <Select
              labelId="vrt-label"
              value={category}
              label="VRT Category"
              onChange={(e) => setCategory(e.target.value)}
            >
              {vrtOptions.map((cat) => (
                <MenuItem key={cat} value={cat}>{cat}</MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
      </Paper>
      {(
        (platform === 'bugcrowd' && bugcrowdCategory && bugcrowdSubcategory && ((bugcrowdVariants.length === 0) || bugcrowdVariant)) ||
        ((platform === 'hackerone' || platform === 'google') && category)
      ) && (
        <Paper elevation={4} sx={{ p: { xs: 2, sm: 4 }, borderRadius: 3, boxShadow: 6, width: '100%', mb: 4 }}>
          <LearningModule platform={platform} category={category} />
        </Paper>
      )}
    </Container>
  );
}

export default App;
