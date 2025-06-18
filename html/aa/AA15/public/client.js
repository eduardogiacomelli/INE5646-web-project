const socket = io();
let currentPlayer = "X",
  mySymbol = null,
  gameActive = !1,
  board = Array(9).fill(null),
  scores = { X: 0, O: 0 };
const cells = document.querySelectorAll(".cell"),
  resetBtn = document.getElementById("resetBtn"),
  resetServerBtn = document.getElementById("resetServerBtn"),
  botBtn = document.getElementById("botBtn"),
  humanBtn = document.getElementById("humanBtn"),
  leaveBtn = document.getElementById("leaveBtn"),
  currentPlayerDisplay = document.getElementById("currentPlayer"),
  statusDisplay = document.getElementById("status"),
  player1Score = document.getElementById("player1"),
  player2Score = document.getElementById("player2");
function handleCellClick(e) {
  gameActive &&
    null === board[e] &&
    currentPlayer === mySymbol &&
    socket.emit("makeMove", { index: e });
}
function updateDisplay() {
  cells.forEach((e, t) => {
    (e.textContent = board[t] || ""),
      (e.className = "cell"),
      board[t] && e.classList.add(board[t].toLowerCase());
  }),
    gameActive
      ? ((currentPlayerDisplay.textContent = `Vez do jogador ${currentPlayer}`),
        (statusDisplay.textContent =
          currentPlayer === mySymbol ? "Sua vez!" : "Aguardando jogada..."))
      : (currentPlayerDisplay.textContent = "Aguardando jogadores...");
}
function updateScores() {
  (player1Score.textContent = `Jogador X: ${scores.X}`),
    (player2Score.textContent = `Jogador O: ${scores.O}`);
}
function highlightWinner(e) {
  if ("tie" !== e) {
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
      const [t, n, o] = a;
      if (board[t] === e && board[n] === e && board[o] === e) {
        cells[t].classList.add("winner"),
          cells[n].classList.add("winner"),
          cells[o].classList.add("winner");
        break;
      }
    }
  }
}
function resetGame() {
  (board = Array(9).fill(null)),
    cells.forEach((e) => {
      (e.textContent = ""), (e.className = "cell");
    }),
    (statusDisplay.textContent = "");
}
cells.forEach((e, t) => {
  e.addEventListener("click", () => handleCellClick(t));
}),
  resetBtn.addEventListener("click", () => {
    socket.emit("resetGame");
  }),
  resetServerBtn.addEventListener("click", () => {
    confirm(
      "Tem certeza que deseja resetar o servidor completamente? Isso afetará todos os jogadores."
    ) && socket.emit("resetServer");
  }),
  socket.on("serverReset", () => {
    location.reload();
  }),
  botBtn.addEventListener("click", () => {
    socket.emit("enableBot"),
      (botBtn.style.display = "none"),
      (humanBtn.style.display = "none");
  }),
  humanBtn.addEventListener("click", () => {
    socket.emit("waitForHuman"),
      (humanBtn.style.display = "none"),
      (botBtn.style.display = "block"),
      (statusDisplay.textContent = "Aguardando jogador humano...");
  }),
  leaveBtn.addEventListener("click", () => {
    socket.emit("leaveGame");
  }),
  socket.on("playerAssigned", (e) => {
    (mySymbol = e.symbol),
      (statusDisplay.textContent = `Você é o jogador ${mySymbol}`),
      "X" === mySymbol &&
        ((currentPlayerDisplay.textContent = "Aguardando outro jogador..."),
        (botBtn.style.display = "block"),
        (humanBtn.style.display = "block"));
  }),
  socket.on("gameStart", (e) => {
    (gameActive = !0),
      (currentPlayer = e.currentPlayer),
      (board = e.board),
      updateDisplay(),
      (statusDisplay.textContent = "Jogo iniciado!"),
      (botBtn.style.display = "none"),
      (humanBtn.style.display = "none");
  }),
  socket.on("botEnabled", (e) => {
    (gameActive = e.gameActive),
      (currentPlayer = e.currentPlayer),
      updateDisplay(),
      (statusDisplay.textContent = "Bot adicionado! Jogo iniciado!"),
      (humanBtn.style.display = "none");
  }),
  socket.on("humanJoined", (e) => {
    (gameActive = !0),
      (currentPlayer = e.currentPlayer),
      (board = e.board),
      updateDisplay(),
      (statusDisplay.textContent = "Jogador humano entrou!"),
      (botBtn.style.display = "none"),
      (humanBtn.style.display = "none");
  }),
  socket.on("waitingForHuman", () => {
    (gameActive = !1),
      (statusDisplay.textContent = "Aguardando jogador humano..."),
      (botBtn.style.display = "block"),
      (humanBtn.style.display = "none");
  }),
  socket.on("gameState", (e) => {
    (board = e.board),
      (currentPlayer = e.currentPlayer),
      (gameActive = e.gameActive),
      (scores = e.scores),
      updateDisplay(),
      updateScores(),
      1 !== e.players.length ||
        e.botEnabled ||
        e.waitingForHuman ||
        ((botBtn.style.display = "block"), (humanBtn.style.display = "block"));
  }),
  socket.on("gameUpdate", (e) => {
    (board = e.board), (currentPlayer = e.currentPlayer), updateDisplay();
  }),
  socket.on("gameEnd", (e) => {
    (board = e.board),
      (scores = e.scores),
      (gameActive = !1),
      updateDisplay(),
      updateScores(),
      highlightWinner(e.winner),
      "tie" === e.winner
        ? (statusDisplay.textContent = "Empate!")
        : (statusDisplay.textContent = `Jogador ${e.winner} venceu!`),
      setTimeout(() => {
        resetGame();
      }, 3e3);
  }),
  socket.on("gameReset", (e) => {
    (board = e.board),
      (currentPlayer = e.currentPlayer),
      (gameActive = e.gameActive),
      resetGame(),
      updateDisplay();
  }),
  socket.on("serverReset", (e) => {
    resetGame(),
      (statusDisplay.textContent = e.message + " - Estado inicial restaurado"),
      (mySymbol = null),
      (botBtn.style.display = "none"),
      (humanBtn.style.display = "none"),
      (scores = { X: 0, O: 0 }),
      updateScores(),
      setTimeout(() => {
        statusDisplay.textContent = "";
      }, 3e3);
  }),
  socket.on("playerDisconnected", (e) => {
    0 === e.playersCount
      ? (resetGame(),
        (statusDisplay.textContent = "Todos os jogadores desconectaram"),
        (botBtn.style.display = "none"),
        (humanBtn.style.display = "none"))
      : 1 !== e.playersCount ||
        e.gameActive ||
        ((statusDisplay.textContent = "Outro jogador desconectou"),
        (botBtn.style.display = "block"),
        (humanBtn.style.display = "block"),
        (gameActive = !1));
  }),
  socket.on("playerLeft", (e) => {
    0 === e.playersCount
      ? (resetGame(),
        (statusDisplay.textContent = "Todos os jogadores saíram"),
        (botBtn.style.display = "none"),
        (humanBtn.style.display = "none"))
      : 1 !== e.playersCount ||
        e.gameActive ||
        ((statusDisplay.textContent = "Outro jogador saiu do jogo"),
        (botBtn.style.display = "block"),
        (humanBtn.style.display = "block"),
        (gameActive = !1));
  }),
  socket.on("leftGame", () => {
    resetGame(),
      (statusDisplay.textContent = "Você saiu do jogo"),
      (mySymbol = null),
      (botBtn.style.display = "none"),
      (humanBtn.style.display = "none");
  }),
  socket.on("gameFull", () => {
    statusDisplay.textContent = "Sala cheia! Tente novamente mais tarde.";
  });
