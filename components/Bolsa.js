import React, { useState, useEffect } from "react";
import axios from "axios";
import styles from "../styles/Bolsa.module.css";

const App = () => {
  const [rates, setRates] = useState({
    USD: null,
    EUR: null,
    BTC: null,
    IBOVESPA: null,
    SP500: null,
    Ouro: null,
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const API_KEY = process.env.NEXT_PUBLIC_ALPHA_VANTAGE_API_KEY;

 
  // Função para formatar valores monetários
  const formatCurrency = (value) => {
    if (value === null || value === undefined) return "N/A";
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
  };

  const fetchCotacoes = async () => {
    setLoading(true);
    setError(null);
    try {
      const [usdResponse, eurResponse, btcResponse, sp500Response, goldResponse, ibovespaResponse] = await Promise.all([
        axios.get("https://api.exchangerate-api.com/v4/latest/USD"),
        axios.get("https://api.exchangerate-api.com/v4/latest/EUR"),
        axios.get("https://api.blockchain.com/v3/exchange/tickers/BTC-USD"),
        axios.get("https://www.alphavantage.co/query", {
          params: {
            function: "TIME_SERIES_INTRADAY",
            symbol: "SPY",
            interval: "5min",
            apikey: API_KEY,
          },
        }),
        axios.get("https://www.alphavantage.co/query", {
          params: {
            function: "TIME_SERIES_DAILY",
            symbol: "XAUUSD",
            interval: "1day",
            apikey: API_KEY,
          },
        }),
        axios.get("https://www.alphavantage.co/query", {
          params: {
            function: "TIME_SERIES_DAILY",
            symbol: "IBOV.SA",
            interval: "1day",
            apikey: API_KEY,
          },
        }),
      ]);

      const sp500Data = sp500Response.data["Time Series (5min)"];
      const lastSP500Close = sp500Data ? parseFloat(sp500Data[Object.keys(sp500Data)[0]]["4. close"]) : null;

      const goldData = goldResponse.data["Time Series (Daily)"];
      const lastGoldDate = goldData ? Object.keys(goldData)[0] : null;
      const goldPrice = goldData ? parseFloat(goldData[lastGoldDate]["4. close"]) : null;

      const ibovespaData = ibovespaResponse.data['Time Series (Daily)'];
      const ibovespaPrice = ibovespaData
        ? parseFloat(ibovespaData[Object.keys(ibovespaData)[0]]["4. close"])
        : null;

      setRates({
        USD: usdResponse.data.rates.BRL || 0,
        EUR: eurResponse.data.rates.BRL || 0,
        BTC: parseFloat(btcResponse.data.last_trade_price) || 0,
        IBOVESPA: ibovespaPrice || 0,
        SP500: lastSP500Close || 0,
        Ouro: goldPrice || 0,
      });
    } catch (err) {
      setError("Erro ao buscar as cotações. Tente novamente mais tarde.");
      console.error("Error fetching exchange rates:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCotacoes();
  }, []);

  // Calcula a largura total dos itens e ajusta o tempo de animação
  useEffect(() => {
    const totalWidth = Object.keys(rates).length * 150; // 150px é o tamanho mínimo de cada item
    const animationDuration = totalWidth / 50; // Ajuste esse valor conforme necessário
    document.documentElement.style.setProperty('--ticker-duration', `${animationDuration}s`);
  }, [rates]);

  if (loading) return <div className={styles.loader}>Carregando...</div>;
  if (error) {
    return (
      <div className={styles.error}>
        <p>{error}</p>
        <button onClick={fetchCotacoes} className={styles.retryButton}>
          Tentar Novamente
        </button>
      </div>
    );
  }

  return (
    <div className={styles.tickerContainerWrapper}>
      <div className={styles.tickerContainer} style={{ animationDuration: 'var(--ticker-duration)' }}>
        {Object.entries(rates).map(([currency, rate]) => (
          <div key={currency} className={styles.cambioItem}>
            <p>
              {currency} : {formatCurrency(rate)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default App;
