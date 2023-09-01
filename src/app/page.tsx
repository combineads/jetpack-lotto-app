'use client';

import React, {useState} from 'react';
import {QrScanner} from '@yudiel/react-qr-scanner';
import {Box, Button, FormControlLabel, Radio, RadioGroup, TextField, Typography} from '@mui/material';

// Fisher-Yates (aka Knuth) Shuffle
const shuffleArray = (array: number[]) => {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

const App: React.FC = () => {
  const [scanLottoData, setScanLottoData] = useState<number[][]>([]);
  const [luckyNumbers, setLuckyNumbers] = useState<number[]>([]);
  const [recommendedLottoNumbers, setRecommendedLottoNumbers] = useState<number[][]>([]);
  const [algorithm, setAlgorithm] = useState('groupShuffle');
  const [lottoSetSize, setLottoSetSize] = useState<number>(5);

  const handleScan = (data: string) => {
    if (!data || !data.startsWith('http')) {
      return;
    }
    try {
      const param = new URLSearchParams(new URL(data).search).get('v');
      if (!param) {
        return;
      }

      const parts = param.split(/[a-zA-Z]/);
      const sets = parts.slice(1).map((set) => {
        const numbers: number[] = [];
        for (let i = 0; i < 12; i += 2) {
          const number = parseInt(set.substring(i, i + 2), 10);
          if (isNaN(number)) {
            throw new Error('Invalid number in QR code');
          }
          numbers.push(number);
        }
        return numbers;
      });

      setScanLottoData(sets);
      recommendLottoNumbers(sets);
    } catch (e) {
      console.error(`Invalid URL or Parameters: ${data}`, e);
    }
  };

  const recommendLottoNumbers = (sets: number[][]) => {
    const excludedNumbers = sets.flat();
    let availableNumbers = Array.from({length: 45}, (_, i) => i + 1).filter((n) => !excludedNumbers.includes(n)).sort((a, b) => a - b);
    setLuckyNumbers([...availableNumbers]);
    const requiredNumbers = lottoSetSize * 6; // Total numbers required for all sets
    let newLottoSets: number[][] = [];

    if (algorithm === 'normal') {
      newLottoSets = runNormalAlgorithm(availableNumbers, requiredNumbers, lottoSetSize);
    } else if (algorithm === 'groupShuffle') {
      newLottoSets = runGroupShuffleAlgorithm(availableNumbers, requiredNumbers, lottoSetSize);
    } else if (algorithm === 'shuffe') {
      newLottoSets = runShuffleAlgorithm(shuffleArray(availableNumbers), newLottoSets, lottoSetSize);
    }

    setRecommendedLottoNumbers(newLottoSets);
  };

  const runShuffleAlgorithm = (availableNumbers: number[], newLottoSets: number[][], lottoSetSize: number) => {
    // Fill in the remaining sets with random numbers
    while (newLottoSets.length < lottoSetSize) {
      const randomSet = shuffleArray(availableNumbers).slice(0, 6).sort((a, b) => a - b);
      newLottoSets.push(randomSet);
    }

    return newLottoSets;
  }

  const runNormalAlgorithm = (availableNumbers: number[], requiredNumbers: number, lottoSetSize: number) => {
    let newLottoSets: number[][] = [];
    const availableLength = availableNumbers.length;

    // Case 1: Enough available numbers to fill all sets
    if (availableLength >= requiredNumbers) {
      for (let i = 0; i < lottoSetSize; i++) {
        const offset = i * 6;
        const newSet = availableNumbers.slice(offset, offset + 6);
        newLottoSets.push(newSet);
      }
    }
    // Case 2: Not enough available numbers, need to fill in
    else {
      const setsToFill = Math.floor(availableLength / 6);
      const extraNumbers = availableLength % 6;

      // Fill as many complete sets as we can
      for (let i = 0; i < setsToFill; i++) {
        const offset = i * 6;
        const newSet = availableNumbers.slice(offset, offset + 6);
        newLottoSets.push(newSet);
      }

      // Create an array with the extra numbers
      let extraArray = availableNumbers.slice(setsToFill * 6);
      let neededArray = availableNumbers.slice(0, extraNumbers);
      let combinedExtras = [...extraArray, ...neededArray];

      // Append the extra numbers to complete the sets
      newLottoSets.push(combinedExtras);

      runShuffleAlgorithm(availableNumbers, newLottoSets, lottoSetSize);
    }

    return newLottoSets;
  };

  const runGroupShuffleAlgorithm = (availableNumbers: number[], requiredNumbers: number, lottoSetSize: number): number[][] => {
    let newLottoSets: number[][] = [];

    // Create Groups of 6 from availableNumbers
    const groups: number[][] = [];
    for (let i = 0; i < availableNumbers.length; i += 6) {
      groups.push(availableNumbers.slice(i, i + 6));
    }

    // Generate a flattened array based on your new logic
    const generateFlattenedArray = (arrays: number[][]): number[] => {
      let flattenedArray: number[] = [];
      const minLength = Math.min(...arrays.map((arr) => arr.length));

      for (let i = 0; i < minLength; i++) {
        arrays.forEach((arr) => {
          if (arr[i] !== undefined) {
            flattenedArray.push(arr[i]);
          }
        });
      }

      for (let i = minLength; i < 6; i++) {
        arrays.forEach((arr) => {
          if (arr[i] !== undefined) {
            flattenedArray.push(arr[i]);
          }
        });
      }

      return flattenedArray;
    };

    const flattenedArray = generateFlattenedArray(groups);
    console.log('flattenedArray', flattenedArray);
    return runNormalAlgorithm(flattenedArray, requiredNumbers, lottoSetSize);
  };

  return (<Box display="flex" flexDirection="column" alignItems="center">
    <Typography variant="h2" sx={{textTransform: 'uppercase', fontWeight: 600}}>
      Lotto App
    </Typography>
    <Box width={500}>
      <QrScanner
          onDecode={handleScan}
          onError={(error) => console.log(error?.message)}
          scanDelay={1000}
      />
    </Box>
    <Box>
      <RadioGroup row value={algorithm} onChange={(e) => setAlgorithm(e.target.value)}>
        <FormControlLabel value="normal" control={<Radio/>} label="Ordered" defaultChecked/>
        <FormControlLabel value="groupShuffle" control={<Radio/>} label="Group Shuffle"/>
        <FormControlLabel value="shuffe" control={<Radio/>} label="Shuffe"/>
      </RadioGroup>
      <TextField
          type="number"
          label="Set Count"
          value={lottoSetSize}
          variant="standard"
          onChange={(e) => {
            const value = parseInt(e.target.value, 10);
            setLottoSetSize(isNaN(value) ? 0 : value);
          }}
      />
      <Button variant="contained" color="inherit" onClick={() => recommendLottoNumbers(scanLottoData)}>
        Generate
      </Button>
    </Box>
    {/* Scanned lotto numbers */}
    {scanLottoData.length > 0 && <Typography variant="h4" sx={{mt: 5}}>
      Scanned Lotto Numbers
    </Typography>}
    {scanLottoData.map((set, index) => (<Typography key={index} variant="body1">
      {set.join(', ')}
    </Typography>))}
    {/* Lucky numbers */}
    {luckyNumbers.length > 0 && <Typography variant="h4" sx={{mt: 5}}>
      Lucky Numbers
    </Typography>}
    {luckyNumbers.length > 0 && <Typography variant="body1" sx={{ml: 15, mr: 15}}>
      {luckyNumbers.join(', ')}
    </Typography>}

    {/* Recommended numbers */}
    {recommendedLottoNumbers.length > 0 && <Typography variant="h4" sx={{mt: 5}}>
      Recommended Lotto Numbers
    </Typography>}
    {recommendedLottoNumbers.map((set, index) => (<Typography key={index} variant="body1">
      {set.sort((a, b) => a - b).join(', ')}
    </Typography>))}
  </Box>);
};

export default App;
