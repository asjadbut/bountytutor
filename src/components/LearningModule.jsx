import React, { useEffect, useState } from 'react';
import geminiService from '../services/gemini.js';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, CircularProgress, Alert, Box, Typography, ToggleButton, ToggleButtonGroup, Paper, List, ListItem, ListItemText, Avatar
} from '@mui/material';
import SchoolIcon from '@mui/icons-material/School';
import LinkIcon from '@mui/icons-material/Link';

const SECTIONS = [
  { key: 'what', label: 'What is it?' },
  { key: 'find', label: 'How to find it' },
  { key: 'reproduce', label: 'How to reproduce it' },
  { key: 'references', label: 'Reference reports' },
  { key: 'poc', label: 'PoC & Payload Examples' },
  { key: 'tips', label: 'Tips for Beginners' },
];

const FALLBACKS = {
  tips: 'Start with the basics and read official documentation.\nPractice on safe, legal platforms like bug bounty labs.',
  poc: 'PoC examples are for educational purposes only. Always use them responsibly and only in authorized environments.'
};

function buildPrompt(platform, category, mode) {
  if (mode === 'detailed') {
    return `You are an expert bug bounty tutor. For the vulnerability "${category}" on ${platform}, provide detailed, step-by-step, and example-rich answers for each section below.\n\nFormat your response exactly as follows (do NOT use asterisks or markdown symbols for lists):\n\nWhat is it?:\n[A thorough explanation, including background, real-world context, and why it matters]\n\nHow to find it:\n- [detailed tip 1]\n- [detailed tip 2]\n- [detailed tip 3]\n\nHow to reproduce it:\n1. [step 1 with explanation]\n2. [step 2 with explanation]\n3. [step 3 with explanation]\n\nReference reports:\n- [link 1] - [summary and what can be learned]\n- [link 2] - [summary and what can be learned]\n\nPoC & Payload Examples (for learning only):\n[example PoC or payload, with code and a clear explanation, nothing malicious]\n\nTips for Beginners:\n- [actionable tip 1 with explanation]\n- [actionable tip 2 with explanation]\n`;
  }
  // Concise mode
  return `You are an expert bug bounty tutor. For the vulnerability "${category}" on ${platform}, provide concise, beginner-friendly answers for each section below.\n\nFormat your response exactly as follows (do NOT use asterisks or markdown symbols for lists):\n\nWhat is it?:\n[3-4 short sentences]\n\nHow to find it:\n- [tip 1]\n- [tip 2]\n\nHow to reproduce it:\n1. [step 1]\n2. [step 2]\n\nReference reports:\n- [link 1] - [1 sentence summary]\n\nPoC & Payload Examples (for learning only):\n[short example PoC or payload, 1-sentence explanation, nothing malicious]\n\nTips for Beginners:\n- [tip 1]\n- [tip 2]\n`;
}

function parseSections(responseText) {
  // Split by section headers
  const result = {};
  let current = null;
  responseText.split(/\r?\n/).forEach(line => {
    const header = SECTIONS.find(s => line.trim().toLowerCase().startsWith(s.label.toLowerCase()));
    if (header) {
      current = header.key;
      result[current] = '';
    } else if (current) {
      result[current] += (result[current] ? '\n' : '') + line;
    }
  });
  // Clean up
  Object.keys(result).forEach(k => result[k] = result[k].trim());
  return result;
}

function renderSectionContent(key, text) {
  if (!text) return null;
  // Remove asterisks and extra whitespace
  let clean = text.replace(/^\*+/gm, '').replace(/\*+/g, '').replace(/\n{2,}/g, '\n').trim();
  // Render lists for certain sections
  if (["find", "tips"].includes(key)) {
    const items = clean.split(/^- /gm).map(s => s.trim()).filter(Boolean);
    if (items.length > 1) {
      return (
        <List dense>
          {items.map((item, i) => <ListItem key={i}><ListItemText primary={item} /></ListItem>)}
        </List>
      );
    }
  }
  if (key === "reproduce") {
    // Split on lines starting with a number and a dot (e.g., 1. Step)
    const steps = clean.split(/^\d+\. /gm).map(s => s.trim()).filter(s => s);
    if (steps.length > 1) {
      return (
        <List dense>
          {steps.map((step, i) => <ListItem key={i}><ListItemText primary={`${i + 1}. ${step}`} /></ListItem>)}
        </List>
      );
    }
  }
  if (key === "references") {
    // Try to extract links and summaries
    const refs = clean.split(/^- /gm).map(s => s.trim()).filter(Boolean);
    if (refs.length > 0) {
      return (
        <List dense>
          {refs.map((ref, i) => {
            const match = ref.match(/(https?:\/\/\S+)(.*)/);
            if (match) {
              return (
                <ListItem key={i} alignItems="flex-start" sx={{ alignItems: 'flex-start' }}>
                  <LinkIcon color="primary" sx={{ mr: 1, mt: 0.5 }} />
                  <Box>
                    <a href={match[1]} target="_blank" rel="noopener noreferrer" style={{ fontWeight: 600, color: '#1976d2', wordBreak: 'break-all' }}>{match[1]}</a>
                    {match[2] && (
                      <ListItemText
                        primary={match[2].trim()}
                        primaryTypographyProps={{ sx: { fontSize: 14, color: '#444', mt: 0.5 } }}
                      />
                    )}
                  </Box>
                </ListItem>
              );
            }
            return <ListItem key={i}><ListItemText primary={ref} /></ListItem>;
          })}
        </List>
      );
    }
  }
  return <Typography variant="body1" sx={{ whiteSpace: 'pre-line', mb: 1 }}>{clean}</Typography>;
}

export default function LearningModule({ platform, category }) {
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('bountytutor_gemini_key') || '');
  const [showApiDialog, setShowApiDialog] = useState(!apiKey);
  const [pendingKey, setPendingKey] = useState(apiKey);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [content, setContent] = useState({});
  const [mode, setMode] = useState('concise');

  useEffect(() => {
    if (apiKey) {
      geminiService.initialize(apiKey);
      setLoading(true);
      setError('');
      setContent({});
      geminiService.generateSection(buildPrompt(platform, category, mode))
        .then(text => {
          const parsed = parseSections(text || '');
          setContent(parsed);
        })
        .catch(err => setError(err.message || 'Error'))
        .finally(() => setLoading(false));
    }
    // eslint-disable-next-line
  }, [apiKey, platform, category, mode]);

  const handleApiKeySave = () => {
    if (!pendingKey.trim().startsWith('AIza')) return;
    localStorage.setItem('bountytutor_gemini_key', pendingKey.trim());
    setApiKey(pendingKey.trim());
    setShowApiDialog(false);
    geminiService.initialize(pendingKey.trim());
  };

  return (
    <Box className="learning-module">
      <Dialog open={showApiDialog} onClose={() => setShowApiDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Enter Google Gemini API Key</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Google Gemini API Key"
            type="password"
            fullWidth
            variant="outlined"
            value={pendingKey}
            onChange={(e) => setPendingKey(e.target.value)}
            placeholder="AIza..."
            helperText="Your API key is stored locally and never sent to our servers."
            error={!!pendingKey && !pendingKey.startsWith('AIza')}
          />
          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
            <Button 
              variant="text" 
              onClick={() => window.open('https://makersuite.google.com/app/apikey', '_blank')}
              sx={{ textTransform: 'none' }}
            >
              🔑 How to get your Google Gemini API key?
            </Button>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowApiDialog(false)}>Cancel</Button>
          <Button onClick={handleApiKeySave} variant="contained" disabled={!pendingKey.startsWith('AIza')}>Save</Button>
        </DialogActions>
      </Dialog>
      <Paper elevation={4} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, p: 2, mb: 3, borderRadius: 3, background: 'linear-gradient(90deg, #e0e7ff 0%, #f0f4ff 100%)' }}>
        <Typography variant="h5" sx={{ fontWeight: 700, color: 'primary.main', letterSpacing: 1, textAlign: 'center' }}>
          Learn about: <span style={{ color: '#222', fontWeight: 600 }}>{category}</span>
        </Typography>
        <ToggleButtonGroup
          value={mode}
          exclusive
          onChange={(_, val) => val && setMode(val)}
          size="small"
          sx={{ mt: 1 }}
        >
          <ToggleButton value="concise">Concise</ToggleButton>
          <ToggleButton value="detailed">Detailed</ToggleButton>
        </ToggleButtonGroup>
      </Paper>
      {loading ? (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><CircularProgress size={20} /> Loading...</Box>
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : (
        SECTIONS.map(({ key, label }) => (
          <Paper key={key} elevation={3} sx={{ mb: 3, p: 2, borderRadius: 2 }}>
            <Section title={label}>
              {renderSectionContent(key, content[key] && content[key].trim() ? content[key] : (FALLBACKS[key] || 'No info available.'))}
            </Section>
          </Paper>
        ))
      )}
    </Box>
  );
}

function Section({ title, children }) {
  const [open, setOpen] = useState(true);
  return (
    <Box className="learning-section" sx={{ mb: 1 }}>
      <Typography variant="h6" sx={{ cursor: 'pointer', fontWeight: 700, mb: 1, color: 'primary.main' }} onClick={() => setOpen(o => !o)}>
        {title} {open ? '▼' : '▶'}
      </Typography>
      {open && <Box className="section-content" sx={{ pl: 1, pt: 1 }}>{children}</Box>}
    </Box>
  );
} 