"use client";

import { useState } from "react";

type Suit = "♠" | "♥" | "♦" | "♣";
type Rank =
  | "A"
  | "2"
  | "3"
  | "4"
  | "5"
  | "6"
  | "7"
  | "8"
  | "9"
  | "10"
  | "J"
  | "Q"
  | "K";

type Card = {
  suit: Suit;
  rank: Rank;
  value: number;
};

type GameStatus = "betting" | "playing" | "finished";
type RoundOutcome = "win" | "loss" | "push" | "blackjack";

type SessionStats = {
  handsPlayed: number;
  wins: number;
  losses: number;
  pushes: number;
  blackjacks: number;
};

const NUMBER_OF_DECKS = 3;
const TOTAL_SHOE_CARDS = 52 * NUMBER_OF_DECKS;
const STARTING_BALANCE = 1000;
const MIN_BET = 25;
const BET_STEP = 25;
const MAX_BET = 500;

const suits: Suit[] = ["♠", "♥", "♦", "♣"];

const ranks: { rank: Rank; value: number }[] = [
  { rank: "A", value: 11 },
  { rank: "2", value: 2 },
  { rank: "3", value: 3 },
  { rank: "4", value: 4 },
  { rank: "5", value: 5 },
  { rank: "6", value: 6 },
  { rank: "7", value: 7 },
  { rank: "8", value: 8 },
  { rank: "9", value: 9 },
  { rank: "10", value: 10 },
  { rank: "J", value: 10 },
  { rank: "Q", value: 10 },
  { rank: "K", value: 10 },
];

function createDeck(): Card[] {
  const deck: Card[] = [];

  for (const suit of suits) {
    for (const cardRank of ranks) {
      deck.push({
        suit,
        rank: cardRank.rank,
        value: cardRank.value,
      });
    }
  }

  return deck;
}

function shuffleDeck(deck: Card[]): Card[] {
  const shuffledDeck = [...deck];

  for (let i = shuffledDeck.length - 1; i > 0; i--) {
    const randomIndex = Math.floor(Math.random() * (i + 1));

    [shuffledDeck[i], shuffledDeck[randomIndex]] = [
      shuffledDeck[randomIndex],
      shuffledDeck[i],
    ];
  }

  return shuffledDeck;
}

function createShoe(): Card[] {
  const shoe: Card[] = [];

  for (let i = 0; i < NUMBER_OF_DECKS; i++) {
    shoe.push(...createDeck());
  }

  return shuffleDeck(shoe);
}

function calculateScore(hand: Card[]): number {
  let score = hand.reduce((total, card) => total + card.value, 0);
  let aceCount = hand.filter((card) => card.rank === "A").length;

  while (score > 21 && aceCount > 0) {
    score -= 10;
    aceCount--;
  }

  return score;
}

function hasBlackjack(hand: Card[]): boolean {
  return hand.length === 2 && calculateScore(hand) === 21;
}

function getHandGridColumns(cardCount: number): string {
  if (cardCount <= 1) {
    return "minmax(4rem, 6rem)";
  }

  return `repeat(${cardCount - 1}, minmax(1.75rem, 7rem)) minmax(4rem, 6rem)`;
}

function formatChips(amount: number): string {
  if (Number.isInteger(amount)) {
    return amount.toString();
  }

  return amount.toFixed(2);
}

function getPayout(outcome: RoundOutcome, bet: number): number {
  if (outcome === "blackjack") {
    return bet * 2.5;
  }

  if (outcome === "win") {
    return bet * 2;
  }

  if (outcome === "push") {
    return bet;
  }

  return 0;
}

function getOutcomeFromScores(
  playerScore: number,
  dealerScore: number
): RoundOutcome {
  if (playerScore > 21) {
    return "loss";
  }

  if (dealerScore > 21) {
    return "win";
  }

  if (playerScore > dealerScore) {
    return "win";
  }

  if (dealerScore > playerScore) {
    return "loss";
  }

  return "push";
}

function getOutcomeMessage(outcome: RoundOutcome, bet: number): string {
  const payout = getPayout(outcome, bet);
  const profit = payout - bet;

  if (outcome === "blackjack") {
    return `Blackjack! You win ${formatChips(
      profit
    )} chips. Blackjack pays 3:2.`;
  }

  if (outcome === "win") {
    return `You win ${formatChips(profit)} chips.`;
  }

  if (outcome === "loss") {
    return `Dealer wins. You lost ${formatChips(bet)} chips.`;
  }

  return "Push. Your bet was returned.";
}

function PlayingCard({
  card,
  hidden = false,
}: {
  card?: Card;
  hidden?: boolean;
}) {
  if (hidden) {
    return (
      <div className="flex h-24 w-16 shrink-0 items-center justify-center rounded-xl border border-emerald-700 bg-emerald-950 shadow-lg sm:h-32 sm:w-24">
        <p className="text-2xl text-emerald-400">?</p>
      </div>
    );
  }

  if (!card) {
    return null;
  }

  const redSuit = card.suit === "♥" || card.suit === "♦";

  return (
    <div className="flex h-24 w-16 shrink-0 flex-col justify-between rounded-xl bg-white p-2 text-neutral-950 shadow-lg sm:h-32 sm:w-24 sm:p-3">
      <p className={`text-base font-bold sm:text-xl ${redSuit ? "text-red-600" : ""}`}>
        {card.rank}
      </p>

      <p
        className={`self-center text-2xl sm:text-3xl ${
          redSuit ? "text-red-600" : ""
        }`}
      >
        {card.suit}
      </p>

      <p
        className={`self-end text-base font-bold sm:text-xl ${
          redSuit ? "text-red-600" : ""
        }`}
      >
        {card.rank}
      </p>
    </div>
  );
}

export default function BlackjackGame() {
  const [shoe, setShoe] = useState<Card[]>([]);
  const [playerHand, setPlayerHand] = useState<Card[]>([]);
  const [dealerHand, setDealerHand] = useState<Card[]>([]);
  const [status, setStatus] = useState<GameStatus>("betting");
  const [balance, setBalance] = useState(STARTING_BALANCE);
  const [currentBet, setCurrentBet] = useState(50);
  const [reshuffleAt, setReshuffleAt] = useState(52);
  const [shoeNumber, setShoeNumber] = useState(0);
  const [shoeMessage, setShoeMessage] = useState(
    "A new 3 deck shoe will be shuffled when you deal."
  );
  const [result, setResult] = useState(
    "Choose your bet, then deal the cards."
  );
  const [stats, setStats] = useState<SessionStats>({
    handsPlayed: 0,
    wins: 0,
    losses: 0,
    pushes: 0,
    blackjacks: 0,
  });

  const playerScore = calculateScore(playerHand);
  const dealerScore = calculateScore(dealerHand);
  const hideDealerCard = status === "playing";
  const canDeal = status !== "playing" && balance >= currentBet;
  const maxAllowedBet = Math.min(balance, MAX_BET);

  function updateStats(outcome: RoundOutcome) {
    setStats((currentStats) => ({
      handsPlayed: currentStats.handsPlayed + 1,
      wins:
        outcome === "win" || outcome === "blackjack"
          ? currentStats.wins + 1
          : currentStats.wins,
      losses:
        outcome === "loss"
          ? currentStats.losses + 1
          : currentStats.losses,
      pushes:
        outcome === "push"
          ? currentStats.pushes + 1
          : currentStats.pushes,
      blackjacks:
        outcome === "blackjack"
          ? currentStats.blackjacks + 1
          : currentStats.blackjacks,
    }));
  }

  function settleRound(
    outcome: RoundOutcome,
    finalShoe: Card[],
    finalDealerHand: Card[],
    customMessage?: string
  ) {
    const payout = getPayout(outcome, currentBet);

    setShoe(finalShoe);
    setDealerHand(finalDealerHand);
    setBalance((currentBalance) => currentBalance + payout);
    setStatus("finished");
    setResult(customMessage ?? getOutcomeMessage(outcome, currentBet));
    setShoeMessage(
      `Current shoe has ${finalShoe.length} of ${TOTAL_SHOE_CARDS} cards remaining.`
    );
    updateStats(outcome);
  }

  function changeBet(amount: number) {
    if (status === "playing") {
      return;
    }

    setCurrentBet((previousBet) => {
      const nextBet = previousBet + amount;
      const cappedBet = Math.min(nextBet, maxAllowedBet);
      return Math.max(MIN_BET, cappedBet);
    });
  }

  function setPresetBet(amount: number) {
    if (status === "playing") {
      return;
    }

    setCurrentBet(Math.min(amount, maxAllowedBet));
  }

  function dealCards() {
    if (!canDeal) {
      return;
    }

    let activeShoe = [...shoe];
    let startedNewShoe = false;

    if (activeShoe.length === 0 || activeShoe.length <= reshuffleAt) {
      activeShoe = createShoe();
      startedNewShoe = true;
      setShoeNumber((currentShoe) => currentShoe + 1);
    }

    const playerCards = [activeShoe.pop()!, activeShoe.pop()!];
    const dealerCards = [activeShoe.pop()!, activeShoe.pop()!];

    setBalance((currentBalance) => currentBalance - currentBet);
    setShoe(activeShoe);
    setPlayerHand(playerCards);
    setDealerHand(dealerCards);

    if (startedNewShoe) {
      setShoeMessage(
        `New 3 deck shoe shuffled. ${activeShoe.length} cards remain after the deal.`
      );
    } else {
      setShoeMessage(
        `Continuing the current shoe. ${activeShoe.length} cards remain after the deal.`
      );
    }

    const playerBlackjack = hasBlackjack(playerCards);
    const dealerBlackjack = hasBlackjack(dealerCards);

    if (playerBlackjack || dealerBlackjack) {
      if (playerBlackjack && dealerBlackjack) {
        settleRound(
          "push",
          activeShoe,
          dealerCards,
          "Both hands have Blackjack. Push."
        );
        return;
      }

      if (playerBlackjack) {
        settleRound("blackjack", activeShoe, dealerCards);
        return;
      }

      settleRound(
        "loss",
        activeShoe,
        dealerCards,
        `Dealer has Blackjack. You lost ${formatChips(currentBet)} chips.`
      );
      return;
    }

    setStatus("playing");
    setResult("Choose Hit to take another card or Stand to end your turn.");
  }

  function finishDealerTurn(
    currentShoe: Card[],
    currentPlayerHand: Card[],
    currentDealerHand: Card[]
  ) {
    const updatedShoe = [...currentShoe];
    const updatedDealerHand = [...currentDealerHand];

    while (calculateScore(updatedDealerHand) < 17 && updatedShoe.length > 0) {
      updatedDealerHand.push(updatedShoe.pop()!);
    }

    const finalPlayerScore = calculateScore(currentPlayerHand);
    const finalDealerScore = calculateScore(updatedDealerHand);
    const outcome = getOutcomeFromScores(finalPlayerScore, finalDealerScore);

    settleRound(outcome, updatedShoe, updatedDealerHand);
  }

  function hit() {
    if (status !== "playing" || shoe.length === 0) {
      return;
    }

    const updatedShoe = [...shoe];
    const updatedPlayerHand = [...playerHand, updatedShoe.pop()!];
    const updatedPlayerScore = calculateScore(updatedPlayerHand);

    setShoe(updatedShoe);
    setPlayerHand(updatedPlayerHand);
    setShoeMessage(
      `Current shoe has ${updatedShoe.length} of ${TOTAL_SHOE_CARDS} cards remaining.`
    );

    if (updatedPlayerScore > 21) {
      settleRound("loss", updatedShoe, dealerHand);
      return;
    }

    if (updatedPlayerScore === 21) {
      finishDealerTurn(updatedShoe, updatedPlayerHand, dealerHand);
    }
  }

  function stand() {
    if (status !== "playing") {
      return;
    }

    finishDealerTurn(shoe, playerHand, dealerHand);
  }

  function resetBankroll() {
    if (status === "playing") {
      return;
    }

    setBalance(STARTING_BALANCE);
    setCurrentBet(50);
    setPlayerHand([]);
    setDealerHand([]);
    setResult("Bankroll reset. Choose your bet, then deal the cards.");
  }

  return (
    <div className="mt-8 rounded-3xl border border-emerald-900/50 bg-neutral-950 p-3 sm:mt-12 sm:p-8">
      <div className="grid gap-4 xl:grid-cols-[1fr_22rem]">
        <div className="rounded-2xl border border-blue-900/50 bg-linear-to-br from-neutral-900 to-blue-950/30 p-5">
          <p className="text-sm uppercase tracking-[0.2em] text-blue-300">
            Round Status
          </p>

          <p className="mt-3 text-lg font-medium text-white">{result}</p>

          <p className="mt-3 text-sm leading-6 text-neutral-400">
            Blackjack pays 3:2. Regular wins pay 1:1. Pushes return your bet.
          </p>
        </div>

        <div className="rounded-2xl border border-teal-900/50 bg-linear-to-br from-neutral-900 to-teal-950/35 p-5">
          <p className="text-sm uppercase tracking-[0.2em] text-neutral-500">
            Shoe
          </p>

          <p className="mt-3 text-lg font-medium text-white">
            3 Deck Shoe {shoeNumber > 0 ? `#${shoeNumber}` : ""}
          </p>

          <p className="mt-2 text-sm leading-6 text-neutral-400">
            {shoeMessage}
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border border-emerald-900/50 bg-linear-to-br from-neutral-900 to-emerald-950/30 p-4 text-center">
          <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">
            Balance
          </p>
          <p className="mt-2 text-xl font-semibold text-white">
            {formatChips(balance)}
          </p>
        </div>

        <div className="rounded-2xl border border-amber-900/50 bg-linear-to-br from-neutral-900 to-amber-950/30 p-4 text-center">
          <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">
            Bet
          </p>
          <p className="mt-2 text-xl font-semibold text-amber-300">
            {formatChips(currentBet)}
          </p>
        </div>

        <div className="rounded-2xl border border-emerald-900/50 bg-linear-to-br from-neutral-900 to-emerald-950/30 p-4 text-center">
          <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">
            Hands
          </p>
          <p className="mt-2 text-xl font-semibold text-white">
            {stats.handsPlayed}
          </p>
        </div>

        <div className="rounded-2xl border border-emerald-900/50 bg-linear-to-br from-neutral-900 to-emerald-950/30 p-4 text-center">
          <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">
            Record
          </p>
          <p className="mt-2 text-xl font-semibold">
            <span className="text-green-400">{stats.wins}</span>
            <span className="text-white">-</span>
            <span className="text-red-400">{stats.losses}</span>
            <span className="text-white">-</span>
            <span className="text-white">{stats.pushes}</span>
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_auto]">
        <div className="rounded-2xl border border-amber-900/50 bg-linear-to-br from-neutral-900 to-amber-950/30 p-5">
          <p className="text-sm uppercase tracking-[0.2em] text-neutral-500">
            Bet Controls
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            {[25, 50, 100, 250, 500].map((amount) => (
              <button
                key={amount}
                onClick={() => setPresetBet(amount)}
                disabled={status === "playing" || balance < amount}
                className={`rounded-full border px-4 py-2 text-sm font-medium transition active:scale-[0.98] ${
                  currentBet === amount
                    ? "border-emerald-300 bg-emerald-500 text-neutral-950"
                    : "border-emerald-600/60 bg-neutral-950 text-emerald-200 hover:border-emerald-300 hover:bg-emerald-500/15 disabled:cursor-not-allowed disabled:border-neutral-700 disabled:text-neutral-500 disabled:opacity-60"
                }`}
              >
                {amount}
              </button>
            ))}
          </div>

          <div className="mt-5 flex items-center gap-3">
            <button
              onClick={() => changeBet(-BET_STEP)}
              disabled={status === "playing" || currentBet <= MIN_BET}
              className="flex-1 rounded-xl border border-red-500/60 bg-neutral-950 px-4 py-3 text-lg font-semibold text-red-200 transition hover:border-red-300 hover:bg-red-500/15 active:scale-[0.98] disabled:cursor-not-allowed disabled:border-neutral-700 disabled:text-neutral-500 disabled:opacity-60"
            >
              −
            </button>

            <p className="min-w-24 rounded-xl border border-neutral-800 bg-neutral-950 px-4 py-3 text-center text-sm text-neutral-300">
              Step {BET_STEP}
            </p>

            <button
              onClick={() => changeBet(BET_STEP)}
              disabled={status === "playing" || currentBet >= maxAllowedBet}
              className="flex-1 rounded-xl border border-emerald-600/60 bg-neutral-950 px-4 py-3 text-lg font-semibold text-emerald-200 transition hover:border-emerald-300 hover:bg-emerald-500/15 active:scale-[0.98] disabled:cursor-not-allowed disabled:border-neutral-700 disabled:text-neutral-500 disabled:opacity-60"
            >
              +
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-cyan-900/50 bg-linear-to-br from-neutral-900 to-cyan-950/35 p-5">
          <label
            htmlFor="reshuffle-point"
            className="text-sm uppercase tracking-[0.2em] text-neutral-500"
          >
            Reshuffle Point
          </label>

          <select
            id="reshuffle-point"
            value={reshuffleAt}
            onChange={(event) => setReshuffleAt(Number(event.target.value))}
            disabled={status === "playing"}
            className="mt-3 block w-full rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3 text-sm text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value={39}>Deep play - 39 cards left</option>
            <option value={52}>Standard - 52 cards left</option>
            <option value={78}>Early - 78 cards left</option>
          </select>

          <p className="mt-3 max-w-xs text-sm leading-6 text-neutral-400">
            Your selection applies before the next round begins.
          </p>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-emerald-900/50 bg-linear-to-br from-neutral-900 to-emerald-950/40 p-5 sm:p-6">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-xl font-semibold">Dealer</h2>
            <p className="rounded-full border border-neutral-700 px-3 py-1 text-sm text-neutral-300">
              Score: {hideDealerCard ? "?" : dealerScore}
            </p>
          </div>

          <div
            className="mt-6 grid min-h-24 overflow-hidden pb-2 sm:min-h-32"
            style={{ gridTemplateColumns: getHandGridColumns(dealerHand.length) }}
          >
            {dealerHand.length === 0 ? (
              <p className="text-neutral-500">Waiting for deal...</p>
            ) : (
              dealerHand.map((card, index) => (
                <PlayingCard
                  key={`${card.suit}-${card.rank}-${index}`}
                  card={card}
                  hidden={hideDealerCard && index === 1}
                />
              ))
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-emerald-900/50 bg-linear-to-br from-neutral-900 to-emerald-950/40 p-5 sm:p-6">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-xl font-semibold">Player</h2>
            <p className="rounded-full border border-neutral-700 px-3 py-1 text-sm text-neutral-300">
              Score: {playerScore}
            </p>
          </div>

          <div
            className="mt-6 grid min-h-24 overflow-hidden pb-2 sm:min-h-32"
            style={{ gridTemplateColumns: getHandGridColumns(playerHand.length) }}
          >
            {playerHand.length === 0 ? (
              <p className="text-neutral-500">Waiting for deal...</p>
            ) : (
              playerHand.map((card, index) => (
                <PlayingCard
                  key={`${card.suit}-${card.rank}-${index}`}
                  card={card}
                />
              ))
            )}
          </div>
        </section>
      </div>

      <div className="mt-8 flex flex-wrap justify-center gap-4">
        {status !== "playing" && (
          <button
            onClick={dealCards}
            disabled={!canDeal}
            className="rounded-full bg-linear-to-r from-emerald-400 via-emerald-500 to-teal-500 px-8 py-3 font-semibold text-neutral-950 shadow-lg shadow-emerald-500/30 transition hover:bg-linear-to-br active:scale-[0.98] disabled:cursor-not-allowed disabled:from-neutral-700 disabled:via-neutral-700 disabled:to-neutral-700 disabled:text-neutral-400 disabled:shadow-none"
          >
            Deal
          </button>
        )}

        {status === "playing" && (
          <>
            <button
              onClick={hit}
              className="rounded-full bg-linear-to-r from-emerald-400 via-emerald-500 to-teal-500 px-8 py-3 font-semibold text-neutral-950 shadow-lg shadow-emerald-500/30 transition hover:bg-linear-to-br active:scale-[0.98]"
            >
              Hit
            </button>

            <button
              onClick={stand}
              className="rounded-full border border-teal-400/70 bg-teal-500/10 px-8 py-3 font-semibold text-teal-100 transition hover:border-teal-300 hover:bg-teal-500/20 active:scale-[0.98]"
            >
              Stand
            </button>
          </>
        )}



        {balance < MIN_BET && status !== "playing" && (
          <button
            onClick={resetBankroll}
            className="rounded-full border border-amber-500/60 bg-amber-500/10 px-8 py-3 font-semibold text-amber-200 transition hover:border-amber-400 hover:bg-amber-500/20 active:scale-[0.98]"
          >
            Reset Bankroll
          </button>
        )}
      </div>

      <div className="mt-8 rounded-2xl border border-purple-900/50 bg-linear-to-br from-neutral-900 to-indigo-950/30 p-5">
        <p className="text-sm uppercase tracking-[0.2em] text-neutral-500">
          Session Stats
        </p>

        <div className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-5">
          <p className="rounded-xl bg-neutral-950 p-3 text-neutral-300">
            Wins: <span className="font-semibold text-white">{stats.wins}</span>
          </p>

          <p className="rounded-xl bg-neutral-950 p-3 text-neutral-300">
            Losses:{" "}
            <span className="font-semibold text-white">{stats.losses}</span>
          </p>

          <p className="rounded-xl bg-neutral-950 p-3 text-neutral-300">
            Pushes:{" "}
            <span className="font-semibold text-white">{stats.pushes}</span>
          </p>

          <p className="rounded-xl bg-neutral-950 p-3 text-neutral-300">
            Blackjacks:{" "}
            <span className="font-semibold text-white">
              {stats.blackjacks}
            </span>
          </p>

          <p className="rounded-xl bg-neutral-950 p-3 text-neutral-300">
            Hands:{" "}
            <span className="font-semibold text-white">
              {stats.handsPlayed}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}