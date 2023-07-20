const express = require('express');
const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config(); //Load environment variables from .env
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));


const apiKey = process.env.API_KEY;

// Function to get the latest date of available data
async function getLatestDataDate() {
  try {
    const response = await axios.get('https://www.alphavantage.co/query', {
      params: {
        function: 'FX_DAILY',
        apikey: process.env.API_KEY,
      },
    });

    const timeSeries = response.data['Time Series FX (Daily)'];
    const dates = Object.keys(timeSeries);
    const latestDate = dates[0]; // Assuming the API returns the latest date first

    return latestDate;
  } catch (error) {
    console.error(error);
    throw new Error('An error occurred while fetching the latest data date.');
  }
}


// Function to convert a number to a currency format
function convertNumberToCurrencyFormat(number) {
  const numberSystem = {
    Crore: 10000000,
    Lakh: 100000,
    Thousand: 1000,
    Rupees: 1,
  };

  const convertedCurrency = [];
  for (const [unit, value] of Object.entries(numberSystem)) {
    const count = Math.floor(number / value);
    if (count > 0) {
      convertedCurrency.push(`${count} ${unit}`);
      number %= value;
    }
  }

  return convertedCurrency.join(' ');
}

// Route handler for fetching exchange rates
app.get('/api/exchange-rates', async (req, res) => {
  try {
    // Retrieve query parameters from the request
    const amount = parseFloat(document.getElementById('amount').value);
    const fromCurrency = document.getElementById('from-currency').value;
    const toCurrency = document.getElementById('to-currency').value;
    const dated  = document.getElementById('date').value;

    // Construct the API URL with the query parameters and API key
    const base_url = 'https://www.alphavantage.co/query?function=FX_DAILY';
    const main_url = `${base_url}&from_symbol=${fromCurrency}&to_symbol=${toCurrency}&apikey=${apiKey}`;

    // Make the API request to the Alpha Vantage API
    const response = await axios.get(main_url);

    // Check if the API request was successful
    if (response.status !== 200) {
      throw new Error('API request failed. Please check your inputs and try again.');
    }

    // Extract the required data from the API response
    const result = response.data;
    if (!result['Time Series FX (Daily)']) {
      throw new Error('Unexpected response from the API. Please check your inputs and try again.');
    }
    const daily = result['Time Series FX (Daily)'];
    if (!daily[dated]) {
      throw new Error("The requested date is not available in the API's data.");
    }
    const date = daily[dated];
    const rate = parseFloat(date['4. close']);
    const refreshTime = result['Meta Data']['5. Last Refreshed'];

    // Perform the currency conversion calculation
    const output = Math.round(rate * amount * 100) / 100;

    // Format the output amount in the desired currency format
    const formattedOutput = convertNumberToCurrencyFormat(Math.floor(output * 100) / 100);

    // Return the exchange rates and converted amount to the client
    res.json({
      refreshTime,
      rate,
      amount: formattedOutput,
    });
  } catch (error) {
    // Handle any errors that occur during the process
    console.error('An error occurred:', error.message);
    res.status(500).json({ error: 'Failed to fetch exchange rates' });
  }
});

//fallback to handle any undefined routes
app.get('*', (req, res) => {
  res.status(404).json({ error: 'Route not found.' });
});


// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));


  
  
