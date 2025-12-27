import { Market, Bet } from '../types/market';
import { supabase } from '../lib/supabase';

// Get all markets from Supabase
export const getAllMarkets = async (): Promise<Market[]> => {
  const { data, error } = await supabase
    .from('markets')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching markets:', error);
    return [];
  }

  return data.map(market => ({
    id: market.id,
    title: market.title,
    description: market.description,
    category: market.category,
    endDate: market.end_date,
    createdBy: market.created_by,
    createdAt: market.created_at,
    yesPool: parseFloat(market.yes_pool),
    noPool: parseFloat(market.no_pool),
    totalPool: parseFloat(market.total_pool),
    status: market.status
  }));
};

export const getMarkets = async (): Promise<Market[]> => {
  return getAllMarkets();
};

// Save a new market to Supabase
export const saveMarket = async (market: Market): Promise<void> => {
  const { error } = await supabase
    .from('markets')
    .insert({
      title: market.title,
      description: market.description,
      category: market.category,
      end_date: market.endDate,
      created_by: market.createdBy,
      yes_pool: market.yesPool,
      no_pool: market.noPool,
      total_pool: market.totalPool,
      status: market.status
    });

  if (error) {
    console.error('Error saving market:', error);
    throw error;
  }
};

// Update a market in Supabase
export const updateMarket = async (marketId: string, updates: Partial<Market>): Promise<void> => {
  const updateData: any = {};
  
  if (updates.yesPool !== undefined) updateData.yes_pool = updates.yesPool;
  if (updates.noPool !== undefined) updateData.no_pool = updates.noPool;
  if (updates.totalPool !== undefined) updateData.total_pool = updates.totalPool;
  if (updates.status !== undefined) updateData.status = updates.status;

  const { error } = await supabase
    .from('markets')
    .update(updateData)
    .eq('id', marketId);

  if (error) {
    console.error('Error updating market:', error);
    throw error;
  }
};

// Get a single market by ID
export const getMarketById = async (id: string): Promise<Market | undefined> => {
  const { data, error } = await supabase
    .from('markets')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching market:', error);
    return undefined;
  }

  return {
    id: data.id,
    title: data.title,
    description: data.description,
    category: data.category,
    endDate: data.end_date,
    createdBy: data.created_by,
    createdAt: data.created_at,
    yesPool: parseFloat(data.yes_pool),
    noPool: parseFloat(data.no_pool),
    totalPool: parseFloat(data.total_pool),
    status: data.status
  };
};

// Get all bets from Supabase
export const getBets = async (): Promise<Bet[]> => {
  const { data, error } = await supabase
    .from('bets')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching bets:', error);
    return [];
  }

  return data.map(bet => ({
    id: bet.id,
    marketId: bet.market_id,
    userId: bet.user_id,
    betType: bet.bet_type,
    amount: parseFloat(bet.amount),
    createdAt: bet.created_at
  }));
};

// Save a new bet to Supabase
export const saveBet = async (bet: Bet): Promise<void> => {
  const { error } = await supabase
    .from('bets')
    .insert({
      market_id: bet.marketId,
      user_id: bet.userId,
      bet_type: bet.betType,
      amount: bet.amount
    });

  if (error) {
    console.error('Error saving bet:', error);
    throw error;
  }
};

// Get bets for a specific user
export const getUserBets = async (userId: string): Promise<Bet[]> => {
  const { data, error } = await supabase
    .from('bets')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching user bets:', error);
    return [];
  }

  return data.map(bet => ({
    id: bet.id,
    marketId: bet.market_id,
    userId: bet.user_id,
    betType: bet.bet_type,
    amount: parseFloat(bet.amount),
    createdAt: bet.created_at
  }));
};

// Get bets for a specific market
export const getMarketBets = async (marketId: string): Promise<Bet[]> => {
  const { data, error } = await supabase
    .from('bets')
    .select('*')
    .eq('market_id', marketId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching market bets:', error);
    return [];
  }

  return data.map(bet => ({
    id: bet.id,
    marketId: bet.market_id,
    userId: bet.user_id,
    betType: bet.bet_type,
    amount: parseFloat(bet.amount),
    createdAt: bet.created_at
  }));
};
