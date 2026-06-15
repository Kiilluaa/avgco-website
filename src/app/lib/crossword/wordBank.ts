export type CrosswordWord = {
	answer: string;
	clue: string;
	difficulty: "easy" | "medium" | "hard";
};

export const crosswordWordBank: CrosswordWord[] = [
	{
		answer: "BLACKJACK",
		clue: "Card game where the goal is to get close to 21",
		difficulty: "easy",
	},
	{
		answer: "SUDOKU",
		clue: "Number puzzle played on a 9 by 9 grid",
		difficulty: "easy",
	},
	{
		answer: "PUZZLE",
		clue: "A game or problem made to test thinking",
		difficulty: "easy",
	},
	{
		answer: "DEALER",
		clue: "Person who runs the blackjack hand",
		difficulty: "medium",
	},
	{
		answer: "STREAK",
		clue: "A run of wins or completions in a row",
		difficulty: "medium",
	},
	{
		answer: "WINNER",
		clue: "The player who finishes on top",
		difficulty: "easy",
	},
	{
		answer: "NUMBER",
		clue: "A symbol used in Sudoku",
		difficulty: "easy",
	},
	{
		answer: "CLUE",
		clue: "Hint used to solve a crossword answer",
		difficulty: "easy",
	},
	{
		answer: "BOARD",
		clue: "The grid where a puzzle is played",
		difficulty: "easy",
	},
	{
		answer: "PLAYER",
		clue: "Someone using the game",
		difficulty: "easy",
	},
	{
		answer: "ACCOUNT",
		clue: "Where saved game progress belongs",
		difficulty: "medium",
	},
	{
		answer: "WEEKLY",
		clue: "Happening once every seven days",
		difficulty: "easy",
	},
	{
		answer: "ARCADE",
		clue: "A place or page full of games",
		difficulty: "medium",
	},
	{
		answer: "TIMER",
		clue: "It tracks how long the solve takes",
		difficulty: "easy",
	},
	{
		answer: "SCORE",
		clue: "A number showing performance",
		difficulty: "easy",
	},
];