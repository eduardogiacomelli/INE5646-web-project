const express = require("express"),
  https = require("https"),
  fs = require("fs"),
  socketIo = require("socket.io"),
  path = require("path"),
  app = express();
  
  



const sslOptions = {
    key: fs.readFileSync('/home/e.w.giacomelli/.ssl/server.key'), 
cert: fs.readFileSync('/home/e.w.giacomelli/.ssl/server.cert'),
};
const server = https.createServer(sslOptions, app);
const io = socketIo(server, { cors: { origin: "*", methods: ["GET", "POST"] } });

const PORT = 3443;
const HOST = 'localhost';

app.use(express.static(path.join(__dirname, "..", "public"))),
  app.use("/css", express.static(path.join(__dirname, "..", "css"))),
  app.get("/", (e, t) => {
    t.sendFile(path.join(__dirname, "..", "index.html"));
  });
let gameState = {
  board: Array(9).fill(null),
  currentPlayer: "X",
  players: [],
  gameActive: !1,
  botEnabled: !1,
  scores: { X: 0, O: 0 },
  waitingForHuman: !1,
};
function resetGameState() {
  gameState = {
    board: Array(9).fill(null),
    currentPlayer: "X",
    players: [],
    gameActive: !1,
    botEnabled: !1,
    scores: { X: 0, O: 0 },
    waitingForHuman: !1,
  };
}
function makeBotMove() {
  if (!gameState.gameActive || "O" !== gameState.currentPlayer) return;
  if (
    0 ===
    gameState.board
      .map((e, t) => (null === e ? t : null))
      .filter((e) => null !== e).length
  )
    return;
  const e = getBestMove(gameState.board);
  gameState.board[e] = "O";
  const t = checkWinner(gameState.board);
  t
    ? ((gameState.gameActive = !1),
      "tie" !== t && gameState.scores[t]++,
      io.emit("gameEnd", {
        winner: t,
        board: gameState.board,
        scores: gameState.scores,
      }))
    : ((gameState.currentPlayer = "X"),
      io.emit("gameUpdate", {
        board: gameState.board,
        currentPlayer: gameState.currentPlayer,
      }));
}
function getBestMove(e) {
  const t = e.map((e, t) => (null === e ? t : null)).filter((e) => null !== e);
  for (let a of t) {
    if (((e[a] = "O"), "O" === checkWinner(e))) return (e[a] = null), a;
    e[a] = null;
  }
  for (let a of t) {
    if (((e[a] = "X"), "X" === checkWinner(e))) return (e[a] = null), a;
    e[a] = null;
  }
  const a = [0, 2, 6, 8].filter((e) => t.includes(e));
  return a.length > 0
    ? a[Math.floor(Math.random() * a.length)]
    : t.includes(4)
    ? 4
    : t[Math.floor(Math.random() * t.length)];
}
function checkWinner(e) {
  const t = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ];
  for (let a of t) {
    const [t, r, m] = a;
    if (e[t] && e[t] === e[r] && e[t] === e[m]) return e[t];
  }
  return e.every((e) => null !== e) ? "tie" : null;
}
io.on("connection", (e) => {
  gameState.players.length < 2 && !gameState.waitingForHuman
    ? (gameState.players.push({
        id: e.id,
        symbol: 0 === gameState.players.length ? "X" : "O",
      }),
      e.emit("playerAssigned", {
        symbol: gameState.players[gameState.players.length - 1].symbol,
        playerId: e.id,
      }),
      2 === gameState.players.length &&
        ((gameState.gameActive = !0),
        (gameState.waitingForHuman = !1),
        io.emit("gameStart", {
          currentPlayer: gameState.currentPlayer,
          board: gameState.board,
        })))
    : gameState.waitingForHuman && 1 === gameState.players.length
    ? ((gameState.players = gameState.players.filter((e) => "bot" !== e.id)),
      gameState.players.push({ id: e.id, symbol: "O" }),
      (gameState.botEnabled = !1),
      (gameState.waitingForHuman = !1),
      (gameState.gameActive = !0),
      e.emit("playerAssigned", { symbol: "O", playerId: e.id }),
      io.emit("humanJoined", {
        currentPlayer: gameState.currentPlayer,
        board: gameState.board,
      }))
    : e.emit("gameFull"),
    e.emit("gameState", gameState),
    e.on("makeMove", (t) => {
      if (!gameState.gameActive) return;
      const a = gameState.players.find((t) => t.id === e.id);
      if (!a) return;
      if (gameState.currentPlayer !== a.symbol) return;
      if (null !== gameState.board[t.index]) return;
      gameState.board[t.index] = a.symbol;
      const r = checkWinner(gameState.board);
      r
        ? ((gameState.gameActive = !1),
          "tie" !== r && gameState.scores[r]++,
          io.emit("gameEnd", {
            winner: r,
            board: gameState.board,
            scores: gameState.scores,
          }))
        : ((gameState.currentPlayer =
            "X" === gameState.currentPlayer ? "O" : "X"),
          io.emit("gameUpdate", {
            board: gameState.board,
            currentPlayer: gameState.currentPlayer,
          }),
          gameState.botEnabled &&
            "O" === gameState.currentPlayer &&
            setTimeout(() => makeBotMove(), 1e3));
    }),
    e.on("resetGame", () => {
      (gameState.board = Array(9).fill(null)),
        (gameState.currentPlayer = "X"),
        (gameState.gameActive =
          2 === gameState.players.length || gameState.botEnabled),
        io.emit("gameReset", {
          board: gameState.board,
          currentPlayer: gameState.currentPlayer,
          gameActive: gameState.gameActive,
        });
    }),
    e.on("resetServer", () => {
      resetGameState(),
        io.emit("serverReset", { message: "Servidor resetado completamente" });
    }),
    e.on("enableBot", () => {
      1 === gameState.players.length &&
        ((gameState.botEnabled = !0),
        (gameState.waitingForHuman = !1),
        (gameState.players = gameState.players.filter((e) => "bot" !== e.id)),
        gameState.players.push({ id: "bot", symbol: "O" }),
        (gameState.gameActive = !0),
        io.emit("botEnabled", {
          gameActive: !0,
          currentPlayer: gameState.currentPlayer,
        }));
    }),
    e.on("waitForHuman", () => {
      1 === gameState.players.length &&
        ((gameState.botEnabled = !1),
        (gameState.waitingForHuman = !0),
        (gameState.players = gameState.players.filter((e) => "bot" !== e.id)),
        (gameState.gameActive = !1),
        io.emit("waitingForHuman"));
    }),
    e.on("leaveGame", () => {
      (gameState.players = gameState.players.filter((t) => t.id !== e.id)),
        0 === gameState.players.length
          ? resetGameState()
          : 1 !== gameState.players.length ||
            gameState.botEnabled ||
            ((gameState.gameActive = !1), (gameState.waitingForHuman = !1)),
        io.emit("playerLeft", {
          playersCount: gameState.players.length,
          gameActive: gameState.gameActive,
        }),
        e.emit("leftGame");
    }),
    e.on("disconnect", () => {
      (gameState.players = gameState.players.filter((t) => t.id !== e.id)),
        0 === gameState.players.length
          ? resetGameState()
          : 1 !== gameState.players.length ||
            gameState.botEnabled ||
            ((gameState.gameActive = !1), (gameState.waitingForHuman = !1)),
        io.emit("playerDisconnected", {
          playersCount: gameState.players.length,
          gameActive: gameState.gameActive,
        });
    });
}),
  server.listen(PORT, HOST, () => {
    console.log(`Servidor Tic-Tac-Toe rodando em https://${HOST}:${PORT}`);
});







