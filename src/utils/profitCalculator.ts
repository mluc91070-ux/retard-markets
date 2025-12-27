interface Bet {
  bet_type: 'yes' | 'no';
  amount: number;
  market_id: string;
}

interface Market {
  id: string;
  yes_pool: number;
  no_pool: number;
  total_pool: number;
  status: string;
  result?: 'yes' | 'no' | null;
}

/**
 * Calculate profit for a single bet
 * @param bet - The bet object
 * @param market - The market object
 * @returns The profit amount (positive if won, negative if lost, 0 if pending)
 */
export function calculateBetProfit(bet: Bet, market: Market): number {
  // If market is not resolved yet, return 0
  if (market.status !== 'resolved' || !market.result) {
    return 0;
  }

  const betAmount = parseFloat(bet.amount.toString());
  const yesPool = parseFloat(market.yes_pool.toString());
  const noPool = parseFloat(market.no_pool.toString());
  const totalPool = parseFloat(market.total_pool.toString());

  // Check if bet won
  const won = bet.bet_type === market.result;

  if (!won) {
    // Lost bet - return negative amount
    return -betAmount;
  }

  // Won bet - calculate payout based on pool ratios
  const winningPool = bet.bet_type === 'yes' ? yesPool : noPool;
  
  // Avoid division by zero
  if (winningPool === 0) {
    return 0;
  }

  // Calculate payout: (total pool / winning pool) * bet amount
  const payout = (totalPool / winningPool) * betAmount;
  
  // Profit = payout - original bet amount
  const profit = payout - betAmount;

  return profit;
}

/**
 * Calculate total profit from multiple bets
 * @param bets - Array of bets
 * @param markets - Array of markets
 * @returns Total profit
 */
export function calculateTotalProfit(bets: Bet[], markets: Market[]): number {
  let totalProfit = 0;

  bets.forEach(bet => {
    const market = markets.find(m => m.id === bet.market_id);
    if (market) {
      totalProfit += calculateBetProfit(bet, market);
    }
  });

  return totalProfit;
}

/**
 * Calculate win rate
 * @param bets - Array of bets
 * @param markets - Array of markets
 * @returns Win rate as a percentage (0-100)
 */
export function calculateWinRate(bets: Bet[], markets: Market[]): number {
  const resolvedBets = bets.filter(bet => {
    const market = markets.find(m => m.id === bet.market_id);
    return market && market.status === 'resolved' && market.result;
  });

  if (resolvedBets.length === 0) {
    return 0;
  }

  const wonBets = resolvedBets.filter(bet => {
    const market = markets.find(m => m.id === bet.market_id);
    return market && bet.bet_type === market.result;
  });

  return (wonBets.length / resolvedBets.length) * 100;
}
