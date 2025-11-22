 const SUPABASE_URL = 'https://0ec90b57d6e95fcbda19832f.supabase.co';
        const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJib2x0IiwicmVmIjoiMGVjOTBiNTdkNmU5NWZjYmRhMTk4MzJmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4ODE1NzQsImV4cCI6MTc1ODg4MTU3NH0.9I8-U0x86Ak8t2DGaIk0HfvTSLsAyzdnz-Nw00mMkKw';

        const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

        const TILE_COLORS = [
            { bg: 'bg-green-100', text: 'text-green-500' },
            { bg: 'bg-red-100', text: 'text-red-500' },
            { bg: 'bg-blue-100', text: 'text-blue-500' },
            { bg: 'bg-purple-100', text: 'text-purple-500' },
            { bg: 'bg-yellow-100', text: 'text-yellow-500' },
            { bg: 'bg-pink-100', text: 'text-pink-500' },
            { bg: 'bg-blue-100', text: 'text-blue-500' },
            { bg: 'bg-gray-100', text: 'text-gray-500' },
            { bg: 'bg-emerald-100', text: 'text-emerald-500' },
            { bg: 'bg-amber-100', text: 'text-amber-500' },
            { bg: 'bg-lime-100', text: 'text-lime-500' },
            { bg: 'bg-black', text: 'text-cyan-500' },
        ];

        let gameState = {
            tiles: [],
            blankPosition: 11,
            moves: 0,
            isPlaying: false,
            isWon: false,
            timeElapsed: 0,
            timerInterval: null
        };

        function createInitialTiles() {
            const tiles = [];
            for (let i = 0; i < 12; i++) {
                tiles.push({
                    id: i,
                    value: i + 1,
                    position: i,
                    color: TILE_COLORS[i].bg,
                    textColor: TILE_COLORS[i].text,
                    isBlank: i === 11
                });
            }
            return tiles;
        }

        function shuffleTiles(tiles) {
            const shuffled = [...tiles];
            const numbers = Array.from({ length: 11 }, (_, i) => i + 1);

            for (let i = numbers.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [numbers[i], numbers[j]] = [numbers[j], numbers[i]];
            }

            for (let i = 0; i < 11; i++) {
                const tile = tiles.find(t => t.value === numbers[i]);
                shuffled[i] = { ...tile, position: i };
            }

            shuffled[11] = { ...tiles[11], position: 11 };

            return shuffled;
        }

        function renderBoard() {
            const board = document.getElementById('gameBoard');
            board.innerHTML = '';

            const sortedTiles = [...gameState.tiles].sort((a, b) => a.position - b.position);

            sortedTiles.forEach(tile => {
                const tileDiv = document.createElement('div');
                tileDiv.className = `w-32 h-32 flex items-center justify-center rounded-lg text-4xl font-bold transition-all duration-200 ${tile.color} ${tile.textColor}`;
                if (!tile.isBlank) {
                    tileDiv.textContent = tile.value;
                }
                board.appendChild(tileDiv);
            });
        }

        function formatTime(seconds) {
            const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
            const secs = (seconds % 60).toString().padStart(2, '0');
            return `${mins}:${secs}`;
        }

        function updateTimer() {
            document.getElementById('timer').textContent = formatTime(gameState.timeElapsed);
        }

        function startTimer() {
            if (gameState.timerInterval) {
                clearInterval(gameState.timerInterval);
            }
            gameState.timerInterval = setInterval(() => {
                if (gameState.isPlaying && !gameState.isWon) {
                    gameState.timeElapsed++;
                    updateTimer();
                }
            }, 1000);
        }

        function stopTimer() {
            if (gameState.timerInterval) {
                clearInterval(gameState.timerInterval);
                gameState.timerInterval = null;
            }
        }

        function checkWin() {
            return gameState.tiles
                .filter(t => !t.isBlank)
                .every(t => t.position === t.value - 1);
        }

        function moveTile(direction) {
            if (!gameState.isPlaying || gameState.isWon) return;

            const { blankPosition } = gameState;
            const row = Math.floor(blankPosition / 4);
            const col = blankPosition % 4;

            let targetPosition = -1;

            switch (direction) {
                case 'up':
                    if (row > 0) targetPosition = blankPosition - 4;
                    break;
                case 'down':
                    if (row < 2) targetPosition = blankPosition + 4;
                    break;
                case 'left':
                    if (col > 0) targetPosition = blankPosition - 1;
                    break;
                case 'right':
                    if (col < 3) targetPosition = blankPosition + 1;
                    break;
            }

            if (targetPosition === -1) return;

            const tileToMove = gameState.tiles.find(t => t.position === targetPosition);
            const blankTile = gameState.tiles.find(t => t.position === blankPosition);

            if (tileToMove && blankTile) {
                tileToMove.position = blankPosition;
                blankTile.position = targetPosition;
                gameState.blankPosition = targetPosition;
                gameState.moves++;

                renderBoard();

                if (checkWin()) {
                    gameState.isWon = true;
                    stopTimer();
                    showWinMessage();
                    saveGameHistory();
                    updateButtonStates();
                }
            }
        }

        function showWinMessage() {
            const winMessage = document.getElementById('winMessage');
            const winText = document.getElementById('winText');
            winText.textContent = `Hoàn thành trong ${gameState.moves} bước - ${formatTime(gameState.timeElapsed)}`;
            winMessage.classList.remove('hidden');
        }

        function hideWinMessage() {
            document.getElementById('winMessage').classList.add('hidden');
        }

        function updateButtonStates() {
            const buttons = [
                document.getElementById('btnUp'),
                document.getElementById('btnDown'),
                document.getElementById('btnLeft'),
                document.getElementById('btnRight')
            ];

            buttons.forEach(btn => {
                btn.disabled = !gameState.isPlaying || gameState.isWon;
            });
        }

        async function saveGameHistory() {
            try {
                await supabase.from('game_history').insert({
                    step_number: gameState.moves,
                    time_taken: formatTime(gameState.timeElapsed)
                });
                loadGameHistory();
            } catch (error) {
                console.error('Error saving game:', error);
            }
        }

        async function loadGameHistory() {
            try {
                const { data, error } = await supabase
                    .from('game_history')
                    .select('*')
                    .order('created_at', { ascending: false })
                    .limit(10);

                const tbody = document.getElementById('historyTable');

                if (error) {
                    tbody.innerHTML = '<tr><td colspan="3" class="py-4 text-center text-red-500">Lỗi khi tải lịch sử</td></tr>';
                    return;
                }

                if (!data || data.length === 0) {
                    tbody.innerHTML = '<tr><td colspan="3" class="py-4 text-center text-gray-500">Chưa có lịch sử chơi</td></tr>';
                    return;
                }

                tbody.innerHTML = data.map((game, index) => `
                    <tr class="border-b border-gray-200 hover:bg-gray-50">
                        <td class="py-3 px-4">${index + 1}</td>
                        <td class="py-3 px-4">${game.step_number}</td>
                        <td class="py-3 px-4">${game.time_taken}</td>
                    </tr>
                `).join('');
            } catch (error) {
                console.error('Error loading history:', error);
            }
        }

        function startGame() {
            hideWinMessage();
            gameState.tiles = shuffleTiles(createInitialTiles());
            gameState.blankPosition = 11;
            gameState.moves = 0;
            gameState.isPlaying = true;
            gameState.isWon = false;
            gameState.timeElapsed = 0;

            updateTimer();
            renderBoard();
            startTimer();
            updateButtonStates();
        }

        document.getElementById('startBtn').addEventListener('click', startGame);
        document.getElementById('btnUp').addEventListener('click', () => moveTile('up'));
        document.getElementById('btnDown').addEventListener('click', () => moveTile('down'));
        document.getElementById('btnLeft').addEventListener('click', () => moveTile('left'));
        document.getElementById('btnRight').addEventListener('click', () => moveTile('right'));

        document.addEventListener('keydown', (e) => {
            if (!gameState.isPlaying || gameState.isWon) return;

            const key = e.key.toLowerCase();
            switch (key) {
                case 'w':
                case 'arrowup':
                    e.preventDefault();
                    moveTile('up');
                    break;
                case 'a':
                case 'arrowleft':
                    e.preventDefault();
                    moveTile('left');
                    break;
                case 's':
                case 'arrowdown':
                    e.preventDefault();
                    moveTile('down');
                    break;
                case 'd':
                case 'arrowright':
                    e.preventDefault();
                    moveTile('right');
                    break;
            }
        });

        renderBoard();
        loadGameHistory();
        updateButtonStates();

        supabase
            .channel('game_history_changes')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'game_history' }, () => {
                loadGameHistory();
            })
            .subscribe();