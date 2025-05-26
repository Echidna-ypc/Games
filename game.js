const canvas = document.getElementById("board");
const ctx = canvas.getContext("2d");
const size = 5;
const spacing = canvas.width / (size - 1);

let board = Array(size).fill().map(() => Array(size).fill(null));
let goatsToPlace = 20;
let goatsOnBoard = 0;
let currentPlayer = 'goat';
let selected = null;
let tigers = [
  [0, 0], [0, 4], [4, 0], [4, 4]
];

for (let [x, y] of tigers) {
  board[x][y] = 'tiger';
}

function drawBoard() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = "#000";
  ctx.lineWidth = 2;

  for (let i = 0; i < size; i++) {
    ctx.beginPath();
    ctx.moveTo(0, i * spacing);
    ctx.lineTo(canvas.width, i * spacing);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(i * spacing, 0);
    ctx.lineTo(i * spacing, canvas.height);
    ctx.stroke();
  }

  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(canvas.width, canvas.height);
  ctx.moveTo(canvas.width, 0);
  ctx.lineTo(0, canvas.height);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(spacing * 2, 0);
  ctx.lineTo(spacing * 2, canvas.height);
  ctx.moveTo(0, spacing * 2);
  ctx.lineTo(canvas.width, spacing * 2);
  ctx.stroke();

  for (let x = 0; x < size; x++) {
    for (let y = 0; y < size; y++) {
      const piece = board[x][y];
      if (piece) {
        ctx.beginPath();
        ctx.arc(x * spacing, y * spacing, spacing / 4, 0, 2 * Math.PI);
        ctx.fillStyle = piece === 'goat' ? 'blue' : 'orange';
        ctx.fill();
      }
    }
  }

  if (selected) {
    ctx.beginPath();
    ctx.arc(selected[0] * spacing, selected[1] * spacing, spacing / 4, 0, 2 * Math.PI);
    ctx.strokeStyle = "red";
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}

function getCell(x, y) {
  return [
    Math.round(x / spacing),
    Math.round(y / spacing)
  ];
}

function isAdjacent([x1, y1], [x2, y2]) {
  const dx = Math.abs(x1 - x2);
  const dy = Math.abs(y1 - y2);
  return (dx <= 1 && dy <= 1 && (dx + dy > 0));
}

function isJump([x1, y1], [x2, y2]) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  if (Math.abs(dx) === 2 || Math.abs(dy) === 2) {
    const midX = x1 + dx / 2;
    const midY = y1 + dy / 2;
    return [midX, midY];
  }
  return null;
}

function handleClick(e) {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  const cell = getCell(x, y);
  const [cx, cy] = cell;

  if (cx < 0 || cy < 0 || cx >= size || cy >= size) return;

  const piece = board[cx][cy];

  if (currentPlayer === 'goat') {
    if (goatsToPlace > 0 && !piece) {
      board[cx][cy] = 'goat';
      goatsToPlace--;
      goatsOnBoard++;
      currentPlayer = 'tiger';
    } else if (piece === 'goat') {
      selected = [cx, cy];
    } else if (!piece && selected) {
      if (isAdjacent(selected, [cx, cy])) {
        board[selected[0]][selected[1]] = null;
        board[cx][cy] = 'goat';
        selected = null;
        currentPlayer = 'tiger';
      }
    }
  } else if (currentPlayer === 'tiger') {
    if (piece === 'tiger') {
      selected = [cx, cy];
    } else if (!piece && selected) {
      if (isAdjacent(selected, [cx, cy])) {
        board[selected[0]][selected[1]] = null;
        board[cx][cy] = 'tiger';
        selected = null;
        currentPlayer = 'goat';
      } else {
        const mid = isJump(selected, [cx, cy]);
        if (mid) {
          const [mx, my] = mid;
          if (board[mx][my] === 'goat') {
            board[selected[0]][selected[1]] = null;
            board[mx][my] = null;
            goatsOnBoard--;
            board[cx][cy] = 'tiger';
            selected = null;
            currentPlayer = 'goat';
          }
        }
      }
    }
  }

  
  checkWin();
  updateStatus();
  drawBoard();

}

function updateStatus() {
  const status = document.getElementById("status");
  status.textContent = `${currentPlayer === 'goat' ? "Goat" : "Tiger"}'s turn`;
}

canvas.addEventListener("click", handleClick);
drawBoard();
updateStatus();
function checkWin() {
  let movableTigers = 0;
  for (let x = 0; x < size; x++) {
    for (let y = 0; y < size; y++) {
      if (board[x][y] === 'tiger') {
        for (let dx = -1; dx <= 1; dx++) {
          for (let dy = -1; dy <= 1; dy++) {
            if (dx === 0 && dy === 0) continue;
            let nx = x + dx;
            let ny = y + dy;
            let jx = x + 2 * dx;
            let jy = y + 2 * dy;
            if (nx >= 0 && ny >= 0 && nx < size && ny < size && board[nx][ny] === null) {
              movableTigers++;
            } else if (
              jx >= 0 && jy >= 0 && jx < size && jy < size &&
              board[nx][ny] === 'goat' && board[jx][jy] === null
            ) {
              movableTigers++;
            }
          }
        }
      }
    }
  }

  const status = document.getElementById("status");
  if (goatsOnBoard < 5) {
    status.textContent = "🐯 Tigers win! All goats are captured.";
    canvas.removeEventListener("click", handleClick);
  } else if (movableTigers === 0) {
    status.textContent = "🐐 Goats win! Tigers are blocked.";
    canvas.removeEventListener("click", handleClick);
  }
}