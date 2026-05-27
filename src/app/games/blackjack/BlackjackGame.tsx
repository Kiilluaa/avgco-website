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

type GameStatus = "ready" | "playing" | "finished";

const NUMBER_OF_DECKS = 3;
const TOTAL_SHOE_CARDS = 52 * NUMBER_OF_DECKS;

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

function createShoe(): Card[] {
  const shoe: Card[] = [];

  for (let i = 0; i < NUMBER_OF_DECKS; i++) {
    shoe.push(...createDeck());
  }

  return shuffleDeck(shoe);
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

function calculateScore(hand: Card[]): number {
  let score = hand.reduce((total, card) => total + card.value, 0);
  let aceCount = hand.filter((card) => card.rank === "A").length;

  while (score > 21 && aceCount > 0) {
    score -= 10;
    aceCount--;
  }

  return score;
}

function getHandGridColumns(cardCount: number): string {
  if (cardCount <= 1) {
    return "6rem";
  }

  return `repeat(${cardCount - 1}, minmax(0, 7rem)) 6rem`;
}

function determineResult(playerScore: number, dealerScore: number): string {
  if (playerScore > 21) {
    return "You busted. Dealer wins.";
  }

  if (dealerScore > 21) {
    return "Dealer busted. You win!";
  }

  if (playerScore > dealerScore) {
    return "You win!";
  }

  if (dealerScore > playerScore) {
    return "Dealer wins.";
  }

  return "Push. It is a tie.";
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
      <div className="flex h-32 w-24 shrink-0 items-center justify-center rounded-xl border border-neutral-600 bg-neutral-800">
        <p className="text-2xl text-neutral-500">?</p>
      </div>
    );
  }

  if (!card) {
    return null;
  }

  const redSuit = card.suit === "♥" || card.suit === "♦";

  return (
    <div className="flex h-32 w-24 shrink-0 flex-col justify-between rounded-xl bg-white p-3 text-neutral-950 shadow-lg">
      <p className={`text-xl font-bold ${redSuit ? "text-red-600" : ""}`}>
        {card.rank}
      </p>

      <p
        className={`self-center text-3xl ${redSuit ? "text-red-600" : ""}`}
      >
        {card.suit}
      </p>

      <p
        className={`self-end text-xl font-bold ${
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
  const [status, setStatus] = useState<GameStatus>("ready");
  const [reshuffleAt, setReshuffleAt] = useState(52);
  const [shoeNumber, setShoeNumber] = useState(0);
  const [shoeMessage, setShoeMessage] = useState(
    "A new 3-deck shoe will be shuffled when you begin."
  );
  const [result, setResult] = useState(
    "Deal the cards when you are ready to play."
  );

  const playerScore = calculateScore(playerHand);
  const dealerScore = calculateScore(dealerHand);
  const hideDealerCard = status === "playing";

  function dealCards() {
    let activeShoe = [...shoe];
    let startedNewShoe = false;

    if (activeShoe.length === 0 || activeShoe.length <= reshuffleAt) {
      activeShoe = createShoe();
      startedNewShoe = true;
      setShoeNumber((currentShoe) => currentShoe + 1);
    }

    const playerCards = [activeShoe.pop()!, activeShoe.pop()!];
    const dealerCards = [activeShoe.pop()!, activeShoe.pop()!];

    const initialPlayerScore = calculateScore(playerCards);
    const initialDealerScore = calculateScore(dealerCards);

    setShoe(activeShoe);
    setPlayerHand(playerCards);
    setDealerHand(dealerCards);

    if (startedNewShoe) {
      setShoeMessage(
        `New 3-deck shoe shuffled. ${activeShoe.length} cards remain after the deal.`
      );
    } else {
      setShoeMessage(
        `Continuing the current shoe. ${activeShoe.length} cards remain after the deal.`
      );
    }

    if (initialPlayerScore === 21 || initialDealerScore === 21) {
      setStatus("finished");

      if (initialPlayerScore === 21 && initialDealerScore === 21) {
        setResult("Both hands have Blackjack. Push.");
      } else if (initialPlayerScore === 21) {
        setResult("Blackjack! You win!");
      } else {
        setResult("Dealer has Blackjack. Dealer wins.");
      }

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

    setShoe(updatedShoe);
    setDealerHand(updatedDealerHand);
    setStatus("finished");
    setResult(determineResult(finalPlayerScore, finalDealerScore));
    setShoeMessage(
      `Current shoe has ${updatedShoe.length} of ${TOTAL_SHOE_CARDS} cards remaining.`
    );
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
      setStatus("finished");
      setResult("You busted. Dealer wins.");
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

  return (
    <div className="mt-12 rounded-3xl border border-neutral-800 bg-neutral-950 p-6 sm:p-8">
      <div className="mb-8 grid gap-4 lg:grid-cols-[1fr_auto]">
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-5">
          <p className="text-sm uppercase tracking-[0.2em] text-neutral-500">
            Shoe Information
          </p>

          <p className="mt-3 text-lg font-medium text-white">
            3-Deck Shoe {shoeNumber > 0 ? `#${shoeNumber}` : ""}
          </p>

          <p className="mt-2 text-sm leading-6 text-neutral-400">
            {shoeMessage}
          </p>
        </div>

        <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-5">
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
            <option value={39}>Deep play — 39 cards left</option>
            <option value={52}>Standard — 52 cards left</option>
            <option value={78}>Early — 78 cards left</option>
          </select>

          <p className="mt-3 max-w-xs text-sm leading-6 text-neutral-400">
            Your selection applies before the next round begins.
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-5 text-center">
        <p className="text-sm uppercase tracking-[0.2em] text-neutral-500">
          Round Status
        </p>

        <p className="mt-3 text-lg font-medium text-white">{result}</p>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <section className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Dealer</h2>
            <p className="text-neutral-400">
              Score: {hideDealerCard ? "?" : dealerScore}
            </p>
          </div>

          <div className="mt-6 grid min-h-32 overflow-hidden pb-2" style={{ gridTemplateColumns: getHandGridColumns(dealerHand.length) }}>
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

        <section className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Player</h2>
            <p className="text-neutral-400">Score: {playerScore}</p>
          </div>

          <div className="mt-6 grid min-h-32 overflow-hidden pb-2" style={{ gridTemplateColumns: getHandGridColumns(playerHand.length) }}>
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
        {status === "ready" && (
          <button
            onClick={dealCards}
            className="rounded-full bg-white px-7 py-3 font-medium text-neutral-950 transition hover:bg-neutral-200"
          >
            Deal Cards
          </button>
        )}

        {status === "playing" && (
          <>
            <button
              onClick={hit}
              className="rounded-full bg-white px-7 py-3 font-medium text-neutral-950 transition hover:bg-neutral-200"
            >
              Hit
            </button>

            <button
              onClick={stand}
              className="rounded-full border border-neutral-700 px-7 py-3 font-medium text-white transition hover:border-neutral-400"
            >
              Stand
            </button>
          </>
        )}

        {status === "finished" && (
          <button
            onClick={dealCards}
            className="rounded-full bg-white px-7 py-3 font-medium text-neutral-950 transition hover:bg-neutral-200"
          >
            New Round
          </button>
        )}
      </div>
    </div>
  );
}