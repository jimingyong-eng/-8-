/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, Diamond, Club, Spade, RotateCcw, Trophy, User, Cpu, Info } from 'lucide-react';
import { Suit, Rank, CardData, GameStatus, GameState } from './types';
import { createDeck, shuffle, isValidMove, SUITS } from './utils';

// --- Components ---

const SuitIcon = ({ suit, className = "" }: { suit: Suit; className?: string }) => {
  switch (suit) {
    case Suit.HEARTS: return <Heart className={`fill-red-500 text-red-500 ${className}`} />;
    case Suit.DIAMONDS: return <Diamond className={`fill-red-500 text-red-500 ${className}`} />;
    case Suit.CLUBS: return <Club className={`fill-neutral-800 text-neutral-800 ${className}`} />;
    case Suit.SPADES: return <Spade className={`fill-neutral-800 text-neutral-800 ${className}`} />;
  }
};

interface CardProps {
  key?: React.Key;
  card?: CardData;
  isFaceDown?: boolean;
  onClick?: () => void;
  isPlayable?: boolean;
  isHighlighted?: boolean;
  index?: number;
}

const Card = ({ 
  card, 
  isFaceDown = false, 
  onClick, 
  isPlayable = false,
  isHighlighted = false,
  index = 0
}: CardProps) => {
  return (
    <motion.div
      layout
      initial={{ scale: 0.8, opacity: 0, y: 20 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      exit={{ scale: 0.8, opacity: 0, y: -20 }}
      whileHover={isPlayable ? { y: -15, scale: 1.05 } : {}}
      onClick={isPlayable ? onClick : undefined}
      className={`
        relative w-20 h-28 sm:w-24 sm:h-36 rounded-lg card-shadow flex flex-col items-center justify-center cursor-pointer select-none
        ${isFaceDown ? 'bg-blue-800 border-2 border-white/20' : 'bg-white border border-neutral-200'}
        ${isPlayable ? 'ring-2 ring-yellow-400 ring-offset-2 ring-offset-transparent' : ''}
        ${isHighlighted ? 'scale-110 z-10' : ''}
      `}
    >
      {isFaceDown ? (
        <div className="w-full h-full flex items-center justify-center p-2">
          <div className="w-full h-full border-2 border-white/10 rounded-md flex items-center justify-center">
             <div className="text-white/20 font-display font-bold text-2xl">8</div>
          </div>
        </div>
      ) : card ? (
        <>
          <div className={`absolute top-1 left-1 flex flex-col items-center leading-none ${card.suit === Suit.HEARTS || card.suit === Suit.DIAMONDS ? 'text-red-500' : 'text-neutral-900'}`}>
            <span className="text-xs sm:text-sm font-bold">{card.rank}</span>
            <SuitIcon suit={card.suit} className="w-3 h-3" />
          </div>
          <div className="flex flex-col items-center justify-center">
            <SuitIcon suit={card.suit} className="w-8 h-8 sm:w-10 sm:h-10" />
            {card.rank === Rank.EIGHT && (
              <span className="text-[10px] font-bold text-neutral-400 mt-1 uppercase tracking-tighter">Wild</span>
            )}
          </div>
          <div className={`absolute bottom-1 right-1 flex flex-col items-center leading-none rotate-180 ${card.suit === Suit.HEARTS || card.suit === Suit.DIAMONDS ? 'text-red-500' : 'text-neutral-900'}`}>
            <span className="text-xs sm:text-sm font-bold">{card.rank}</span>
            <SuitIcon suit={card.suit} className="w-3 h-3" />
          </div>
        </>
      ) : null}
    </motion.div>
  );
};

export default function App() {
  const [gameState, setGameState] = useState<GameState>({
    deck: [],
    discardPile: [],
    playerHand: [],
    aiHand: [],
    currentPlayer: 'player',
    status: 'menu',
    winner: null,
    currentSuit: null,
  });

  const [message, setMessage] = useState("欢迎来到小季疯狂 8 点！");

  // --- Game Actions ---

  const initGame = useCallback(() => {
    const fullDeck = shuffle(createDeck());
    const playerHand = fullDeck.splice(0, 8);
    const aiHand = fullDeck.splice(0, 8);
    
    // Ensure first discard is not an 8 for simplicity, or handle it
    let firstDiscard = fullDeck.pop()!;
    while (firstDiscard.rank === Rank.EIGHT) {
      fullDeck.unshift(firstDiscard);
      shuffle(fullDeck);
      firstDiscard = fullDeck.pop()!;
    }

    setGameState({
      deck: fullDeck,
      discardPile: [firstDiscard],
      playerHand,
      aiHand,
      currentPlayer: 'player',
      status: 'playing',
      winner: null,
      currentSuit: null,
    });
    setMessage("轮到你了！请匹配花色或点数。");
  }, []);

  // useEffect(() => {
  //   initGame();
  // }, [initGame]);

  // --- Win/Draw Check Effect ---
  useEffect(() => {
    if (gameState.status !== 'playing' && gameState.status !== 'choosing_suit') return;

    // Check for winner
    if (gameState.playerHand.length === 0) {
      setGameState(prev => ({ ...prev, status: 'game_over', winner: 'player' }));
      setMessage("恭喜你！你赢了！");
      return;
    }
    if (gameState.aiHand.length === 0) {
      setGameState(prev => ({ ...prev, status: 'game_over', winner: 'ai' }));
      setMessage("AI 获胜！下次好运。");
      return;
    }

    // Check for draw (deck empty and no one can move)
    if (gameState.deck.length === 0 && gameState.discardPile.length > 0) {
      const topCard = gameState.discardPile[gameState.discardPile.length - 1];
      const playerCanMove = gameState.playerHand.some(c => isValidMove(c, topCard, gameState.currentSuit));
      const aiCanMove = gameState.aiHand.some(c => isValidMove(c, topCard, gameState.currentSuit));
      
      if (!playerCanMove && !aiCanMove) {
        setGameState(prev => ({ ...prev, status: 'game_over', winner: null }));
        setMessage("平局！双方都无牌可出且牌堆已空。");
      }
    }
  }, [gameState.playerHand.length, gameState.aiHand.length, gameState.deck.length, gameState.status, gameState.discardPile.length, gameState.currentSuit]);

  const handleDrawCard = useCallback(() => {
    if (gameState.status !== 'playing' || gameState.currentPlayer !== 'player') return;

    if (gameState.deck.length === 0) {
      setMessage("牌堆已空！跳过回合。");
      setGameState(prev => ({ ...prev, currentPlayer: 'ai' }));
      return;
    }

    setGameState(prev => {
      const newDeck = [...prev.deck];
      const drawnCard = newDeck.pop()!;
      return {
        ...prev,
        deck: newDeck,
        playerHand: [...prev.playerHand, drawnCard],
        currentPlayer: 'ai'
      };
    });
    setMessage("你摸了一张牌。轮到 AI 了。");
  }, [gameState.status, gameState.currentPlayer, gameState.deck.length]);

  const handlePlayCard = useCallback((card: CardData) => {
    if (gameState.status !== 'playing' || gameState.currentPlayer !== 'player') return;

    const topCard = gameState.discardPile[gameState.discardPile.length - 1];
    if (!isValidMove(card, topCard, gameState.currentSuit)) return;

    if (card.rank === Rank.EIGHT) {
      setGameState(prev => ({
        ...prev,
        playerHand: prev.playerHand.filter(c => c.id !== card.id),
        discardPile: [...prev.discardPile, card],
        status: 'choosing_suit',
      }));
      setMessage("请选择一个新的花色！");
    } else {
      setGameState(prev => ({
        ...prev,
        playerHand: prev.playerHand.filter(c => c.id !== card.id),
        discardPile: [...prev.discardPile, card],
        currentPlayer: 'ai',
        currentSuit: null,
      }));
      setMessage("AI 正在思考...");
    }
  }, [gameState.status, gameState.currentPlayer, gameState.discardPile, gameState.currentSuit]);

  const handleSuitChoice = (suit: Suit) => {
    setGameState(prev => ({
      ...prev,
      status: 'playing',
      currentSuit: suit,
      currentPlayer: 'ai',
    }));
    const suitNames = {
      [Suit.HEARTS]: '红心',
      [Suit.DIAMONDS]: '方块',
      [Suit.CLUBS]: '梅花',
      [Suit.SPADES]: '黑桃'
    };
    setMessage(`花色已更改为 ${suitNames[suit]}。轮到 AI 了。`);
  };

  // --- AI Logic ---
  useEffect(() => {
    if (gameState.status === 'playing' && gameState.currentPlayer === 'ai') {
      const timer = setTimeout(() => {
        let aiActionMessage = "";
        
        setGameState(prev => {
          if (prev.status !== 'playing' || prev.currentPlayer !== 'ai') return prev;
          if (prev.discardPile.length === 0) return prev;

          const topCard = prev.discardPile[prev.discardPile.length - 1];
          const playableCards = prev.aiHand.filter(c => isValidMove(c, topCard, prev.currentSuit));

          if (playableCards.length > 0) {
            const nonEights = playableCards.filter(c => c.rank !== Rank.EIGHT);
            const cardToPlay = nonEights.length > 0 
              ? nonEights[Math.floor(Math.random() * nonEights.length)]
              : playableCards[0];

            const newAiHand = prev.aiHand.filter(c => c.id !== cardToPlay.id);
            
            if (cardToPlay.rank === Rank.EIGHT) {
              const suitCounts = newAiHand.reduce((acc, c) => {
                acc[c.suit] = (acc[c.suit] || 0) + 1;
                return acc;
              }, {} as Record<Suit, number>);
              
              const bestSuit = (Object.keys(suitCounts) as Suit[]).sort((a, b) => suitCounts[b] - suitCounts[a])[0] || Suit.HEARTS;
              const suitNames = {
                [Suit.HEARTS]: '红心',
                [Suit.DIAMONDS]: '方块',
                [Suit.CLUBS]: '梅花',
                [Suit.SPADES]: '黑桃'
              };
              aiActionMessage = `AI 打出了 8 并选择了 ${suitNames[bestSuit]}。轮到你了！`;

              return {
                ...prev,
                aiHand: newAiHand,
                discardPile: [...prev.discardPile, cardToPlay],
                currentPlayer: 'player',
                currentSuit: bestSuit,
              };
            } else {
              aiActionMessage = "AI 出了一张牌。轮到你了！";
              return {
                ...prev,
                aiHand: newAiHand,
                discardPile: [...prev.discardPile, cardToPlay],
                currentPlayer: 'player',
                currentSuit: null,
              };
            }
          } else {
            // Draw card
            if (prev.deck.length > 0) {
              const newDeck = [...prev.deck];
              const drawnCard = newDeck.pop()!;
              aiActionMessage = "AI 摸了一张牌。轮到你了！";
              return {
                ...prev,
                deck: newDeck,
                aiHand: [...prev.aiHand, drawnCard],
                currentPlayer: 'player'
              };
            } else {
              aiActionMessage = "AI 跳过了回合。轮到你了！";
              return { ...prev, currentPlayer: 'player' };
            }
          }
        });

        if (aiActionMessage) {
          setMessage(aiActionMessage);
        }
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [gameState.status, gameState.currentPlayer]);

  const topCard = gameState.discardPile[gameState.discardPile.length - 1];

  return (
    <div className="h-screen w-full felt-table flex flex-col items-center justify-between p-4 sm:p-8 overflow-hidden">
      
      {/* Home Menu */}
      <AnimatePresence>
        {gameState.status === 'menu' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-neutral-900/90 backdrop-blur-md p-6"
          >
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-center"
            >
              <div className="flex justify-center gap-2 mb-6">
                <div className="w-12 h-16 bg-white rounded-lg shadow-xl flex items-center justify-center -rotate-12 border border-neutral-200">
                  <Heart className="w-6 h-6 fill-red-500 text-red-500" />
                </div>
                <div className="w-12 h-16 bg-white rounded-lg shadow-xl flex items-center justify-center rotate-12 border border-neutral-200">
                  <Spade className="w-6 h-6 fill-neutral-800 text-neutral-800" />
                </div>
              </div>
              <h1 className="text-4xl sm:text-6xl font-display font-black mb-2 tracking-tighter">
                小季疯狂 <span className="text-yellow-400">8</span> 点
              </h1>
              <p className="text-white/60 mb-8 font-medium">
                作者：<span className="text-white">小季</span>
              </p>
              
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-10 max-w-md mx-auto text-left">
                <h3 className="text-sm font-bold uppercase tracking-widest text-yellow-400 mb-3 flex items-center gap-2">
                  <Info className="w-4 h-4" /> 游戏规则
                </h3>
                <ul className="text-xs sm:text-sm text-white/70 space-y-2 leading-relaxed">
                  <li>• <span className="text-white font-semibold">出牌：</span>必须匹配弃牌堆顶部的<span className="text-white">花色</span>或<span className="text-white">点数</span>。</li>
                  <li>• <span className="text-white font-semibold">万能 8 点：</span>数字“8”是万用牌，可随时打出并指定新花色。</li>
                  <li>• <span className="text-white font-semibold">摸牌：</span>若无牌可出，必须从牌堆摸一张牌。</li>
                  <li>• <span className="text-white font-semibold">获胜：</span>最先清空手中所有牌的一方获得胜利。</li>
                </ul>
              </div>

              <button
                onClick={initGame}
                className="group relative px-16 py-5 bg-white text-neutral-900 font-black rounded-2xl text-xl hover:scale-105 transition-all shadow-[0_0_40px_rgba(255,255,255,0.2)]"
              >
                开始游戏
                <div className="absolute inset-0 rounded-2xl ring-4 ring-white/20 group-hover:ring-white/40 transition-all" />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* AI Area */}
      <div className="w-full flex flex-col items-center gap-2">
        <div className="flex items-center gap-2 bg-black/30 px-4 py-1 rounded-full border border-white/10">
          <Cpu className="w-4 h-4 text-blue-400" />
          <span className="text-sm font-medium">AI 对手 ({gameState.aiHand.length})</span>
        </div>
        <div className="flex justify-center -space-x-12 sm:-space-x-16 h-32 sm:h-40 items-start pt-4">
          <AnimatePresence>
            {gameState.aiHand.map((_, i) => (
              <Card key={`ai-card-${i}`} isFaceDown index={i} />
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Center Area */}
      <div className="flex-1 w-full flex items-center justify-center gap-8 sm:gap-16 relative">
        {/* Draw Pile */}
        <div className="relative group" onClick={handleDrawCard}>
          <div className="absolute -inset-1 bg-white/5 rounded-lg blur-sm group-hover:bg-white/10 transition-colors" />
          <Card isFaceDown />
          <div className="absolute -top-2 -right-2 bg-neutral-800 text-white text-[10px] font-bold px-2 py-0.5 rounded-full border border-white/20">
            {gameState.deck.length}
          </div>
          {gameState.currentPlayer === 'player' && gameState.status === 'playing' && (
             <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-bold uppercase tracking-widest text-white/40">
               摸牌
             </div>
          )}
        </div>

        {/* Discard Pile */}
        <div className="relative">
          <AnimatePresence mode="popLayout">
            <Card 
              key={topCard?.id} 
              card={topCard} 
              isHighlighted={gameState.currentSuit !== null}
            />
          </AnimatePresence>
          {gameState.currentSuit && (
            <div className="absolute -top-4 -right-4 bg-white rounded-full p-1.5 shadow-lg border border-neutral-200 animate-bounce">
              <SuitIcon suit={gameState.currentSuit} className="w-5 h-5" />
            </div>
          )}
          <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-bold uppercase tracking-widest text-white/40">
            弃牌
          </div>
        </div>

        {/* Status Message */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 mt-24 sm:mt-32 w-full text-center">
          <motion.p 
            key={message}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-sm sm:text-lg font-display font-semibold text-white/90 drop-shadow-md"
          >
            {message}
          </motion.p>
        </div>
      </div>

      {/* Player Area */}
      <div className="w-full flex flex-col items-center gap-4">
        <div className="flex justify-center -space-x-8 sm:-space-x-12 h-32 sm:h-40 items-end pb-4">
          <AnimatePresence>
            {gameState.playerHand.map((card, i) => (
              <Card 
                key={card.id} 
                card={card} 
                index={i}
                isPlayable={gameState.status === 'playing' && gameState.currentPlayer === 'player' && isValidMove(card, topCard, gameState.currentSuit)}
                onClick={() => handlePlayCard(card)}
              />
            ))}
          </AnimatePresence>
        </div>
        <div className="flex items-center gap-2 bg-black/30 px-4 py-1 rounded-full border border-white/10">
          <User className="w-4 h-4 text-green-400" />
          <span className="text-sm font-medium">你 ({gameState.playerHand.length})</span>
        </div>
      </div>

      {/* Suit Picker Modal */}
      <AnimatePresence>
        {gameState.status === 'choosing_suit' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-neutral-900 border border-white/10 rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl"
            >
              <h2 className="text-2xl font-display font-bold mb-2">万能 8 点！</h2>
              <p className="text-white/60 mb-8">请选择下一个要出的花色</p>
              <div className="grid grid-cols-2 gap-4">
                {SUITS.map(suit => {
                  const suitNames = {
                    [Suit.HEARTS]: '红心',
                    [Suit.DIAMONDS]: '方块',
                    [Suit.CLUBS]: '梅花',
                    [Suit.SPADES]: '黑桃'
                  };
                  return (
                    <button
                      key={suit}
                      onClick={() => handleSuitChoice(suit)}
                      className="flex flex-col items-center justify-center gap-2 p-6 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl transition-all group"
                    >
                      <SuitIcon suit={suit} className="w-10 h-10 group-hover:scale-110 transition-transform" />
                      <span className="text-xs font-bold uppercase tracking-widest opacity-60 group-hover:opacity-100">{suitNames[suit]}</span>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Game Over Modal */}
      <AnimatePresence>
        {gameState.status === 'game_over' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-neutral-900 border border-white/10 rounded-3xl p-10 max-w-sm w-full text-center shadow-2xl"
            >
              <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-6 ${gameState.winner === 'player' ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
                {gameState.winner === 'player' ? <Trophy className="w-10 h-10" /> : <RotateCcw className="w-10 h-10" />}
              </div>
              <h2 className="text-3xl font-display font-bold mb-2">
                {gameState.winner === 'player' ? '胜利！' : '失败'}
              </h2>
              <p className="text-white/60 mb-8">
                {gameState.winner === 'player' ? '你先清空了所有的牌。' : gameState.winner === 'ai' ? '这次 AI 赢了。' : '双方都无法继续出牌。'}
              </p>
              <button
                onClick={initGame}
                className="w-full py-4 bg-white text-neutral-900 font-bold rounded-2xl hover:bg-neutral-200 transition-colors flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-5 h-5" />
                再玩一次
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Info Button */}
      <button 
        className="fixed top-4 right-4 p-2 bg-white/5 hover:bg-white/10 rounded-full border border-white/10 transition-colors"
        onClick={() => alert("小季疯狂 8 点 规则：\n1. 匹配弃牌堆顶部的花色或点数。\n2. 数字 8 是万能牌：随时打出并指定新花色。\n3. 最先清空手牌者获胜！")}
      >
        <Info className="w-5 h-5 text-white/40" />
      </button>

    </div>
  );
}
