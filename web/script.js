const TIME_LIMIT = 10;
const THRESHOLD = 0.50;
let previousWord = "";
let currentPlayer = 1;
let gameActive = true;
let timeRemaining = TIME_LIMIT;
let timerInterval = null;
let usedWords = [];

let extractor = null;

// 埋め込みパイプラインの初期化
async function initializeExtractor() {
    if (extractor === null) {
        const { pipeline } = await import('https://cdn.jsdelivr.net/npm/@huggingface/transformers@4.0.1');
        extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
    }
}

// コサイン類似度の計算
function cosineSimilarity(vecA, vecB) {
    const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
    const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
    const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
    return dotProduct / (magnitudeA * magnitudeB);
}

// テキスト埋め込みを取得して類似度を計算
async function calculateSimilarity(text1, text2) {
    await initializeExtractor();
    const [embedding1] = await extractor(text1, { pooling: 'mean', normalize: true });
    const [embedding2] = await extractor(text2, { pooling: 'mean', normalize: true });
    
    const embArray1 = Array.from(embedding1.data);
    const embArray2 = Array.from(embedding2.data);
    
    return cosineSimilarity(embArray1, embArray2);
}

// モデルをロード
async function loadModel() {
    const btn = document.getElementById("modelLoadBtn");
    const input = document.getElementById("wordInput");
    const sendBtn = document.querySelector("button[onclick='sendWord()']");
    
    btn.disabled = true;
    btn.textContent = "ロード中...";
    
    try {
        await initializeExtractor();
        btn.style.display = "none";
        input.disabled = false;
        sendBtn.disabled = false;
        input.focus();
        addLog("モデルのロードが完了しました！ゲーム開始できます。");
        console.log("[DEBUG] Model loaded successfully");
    } catch (error) {
        btn.disabled = false;
        btn.textContent = "モデルをロード";
        addLog(`エラー: モデルのロードに失敗しました - ${error.message}`);
        console.error("[DEBUG] Model loading failed:", error);
    }
}

async function sendWord() {
    const input = document.getElementById("wordInput");
    const button = document.querySelector("button[onclick='sendWord()']");
    const word = input.value;

    console.log(`[DEBUG] sendWord called - Player: ${currentPlayer}, Word: ${word}, PreviousWord: ${previousWord}`);

    if(word.length === 0) return;
    if(!gameActive) return;
    if(button.disabled) return;

    stopTimer();
    button.disabled = true;

    if(previousWord === "") {
        addLog(`プレイヤー${currentPlayer}: ${word}`, currentPlayer);
        addLog(`類似率: 0.0% (最初のターン)`, currentPlayer);
        usedWords.push(word);
        previousWord = word;
        currentPlayer = currentPlayer === 1 ? 2 : 1;
        updateTurnDisplay();
        input.value = "";
        input.focus();
        button.disabled = false;
        startTimer();
        console.log(`[DEBUG] First turn complete - Next player: ${currentPlayer}`);
        return;
    }
    
    try {
        console.log(`[DEBUG] Fetching similarity for: "${previousWord}" vs "${word}"`);
        
        // 重複チェック
        if(usedWords.includes(word)) {
            const loser = currentPlayer;
            const winner = currentPlayer === 1 ? 2 : 1;
            addLog(`プレイヤー${currentPlayer}: ${word}`, currentPlayer);
            addLog(`プレイヤー${loser}は過去に登場した言葉を言ってしまいました！`, winner);
            addLog(`プレイヤー${winner}の勝利！`, winner);
            gameActive = false;
            document.getElementById("resetBtn").style.display = "block";
            input.disabled = true;
            button.disabled = false;
            console.log(`[DEBUG] Game Over (Duplicate) - Winner: ${winner}`);
            return;
        }
        
        // プレイヤー1の初ターンはスキップ（API判定なし）
        if(previousWord === "") {
            addLog(`プレイヤー${currentPlayer}: ${word}`, currentPlayer);
            addLog(`類似率: 0.0% (最初のターン)`, currentPlayer);
            usedWords.push(word);
            previousWord = word;
            currentPlayer = currentPlayer === 1 ? 2 : 1;
            updateTurnDisplay();
            input.value = "";
            input.focus();
            button.disabled = false;
            startTimer();
            console.log(`[DEBUG] First turn complete - Next player: ${currentPlayer}`);
            return;
        }
        
        // transformer.jsを使用して類似度を計算
        console.log(`[DEBUG] Computing similarity with transformer.js for: "${previousWord}" vs "${word}"`);
        const similarity = await calculateSimilarity(previousWord, word);

        console.log(`[DEBUG] Similarity: ${similarity}`);

        updateDanger(similarity);

        addLog(`プレイヤー${currentPlayer}: ${word}`, currentPlayer);
        addLog(`類似率: ${(similarity * 100).toFixed(1)}%`, currentPlayer);

        if(similarity >= THRESHOLD) {
            const loser = currentPlayer;
            const winner = currentPlayer === 1 ? 2 : 1;
            addLog(`プレイヤー${loser}は似た言葉を言ってしまいました！`, winner);
            addLog(`プレイヤー${winner}の勝利！`, winner);
            gameActive = false;
            document.getElementById("resetBtn").style.display = "block";
            input.disabled = true;
            button.disabled = false;
            console.log(`[DEBUG] Game Over - Winner: ${winner}`);
            return;
        }

        usedWords.push(word);
        previousWord = word;
        currentPlayer = currentPlayer === 1 ? 2 : 1;
        updateTurnDisplay();
        input.value = "";
        input.focus();
        button.disabled = false;
        stopTimer();
        startTimer();
        console.log(`[DEBUG] Turn complete - Next player: ${currentPlayer}`);
    } catch (error) {
        addLog(`エラーが発生しました: ${error.message}`);
        console.error("Error:", error);
        button.disabled = false;
        startTimer();
    }
}



function startTimer() {
    timeRemaining = TIME_LIMIT;
    updateTimerDisplay();
    
    timerInterval = setInterval(() => {
        timeRemaining--;
        updateTimerDisplay();
        
        if(timeRemaining <= 0) {
            stopTimer();
            onTimeUp();
        }
    }, 1000);
}

function stopTimer() {
    if(timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
}

function updateTimerDisplay() {
    const timerDisplay = document.getElementById("timerDisplay");
    timerDisplay.textContent = `${timeRemaining}秒`;
    
    if(timeRemaining > 5) {
        timerDisplay.className = "timer-display";
    } else if(timeRemaining > 2) {
        timerDisplay.className = "timer-display warning";
    } else {
        timerDisplay.className = "timer-display danger";
    }
}

function onTimeUp() {
    const loser = currentPlayer;
    const winner = currentPlayer === 1 ? 2 : 1;
    addLog(`プレイヤー${loser}が時間切れ！`, winner);
    addLog(`プレイヤー${winner}の勝利！`, winner);
    gameActive = false;
    document.getElementById("wordInput").disabled = true;
    document.getElementById("resetBtn").style.display = "block";
}

function updateTurnDisplay() {
    const turnDisplay = document.getElementById("turnDisplay");
    const input = document.getElementById("wordInput");
    const button = document.querySelector("button[onclick='sendWord()']");
    
    if(currentPlayer === 1) {
        turnDisplay.style.color = "#5577FF";
        input.style.borderColor = "#5577FF";
        button.style.backgroundColor = "#5577FF";
    } else {
        turnDisplay.style.color = "#79A8FF";
        input.style.borderColor = "#79A8FF";
        button.style.backgroundColor = "#79A8FF";
    }
    
    turnDisplay.textContent = `プレイヤー${currentPlayer}の番`;
}

function addLog(text, player = null) {
    const log = document.getElementById("log");
    let className = "";
    
    if(player === 1) {
        className = 'class="player1-log"';
    } else if(player === 2) {
        className = 'class="player2-log"';
    }
    
    log.innerHTML += `<p ${className}>${text}</p>`;
    log.scrollTop = log.scrollHeight;
}

function updateDanger(similarity) {
    const bar = document.getElementById("dangerBar");
    const percent = similarity * 100;
    bar.style.width = `${percent}%`;

    if(percent < 20) {
        bar.style.background = "lime";
    }
    else if(percent < 50) {
        bar.style.background = "yellow";
    }
    else {
        bar.style.background = "red";
    }

    document.getElementById("similarityText").innerText =
        `危険度 ${(percent).toFixed(1)}%`;
}

function resetGame() {
    stopTimer();
    previousWord = "";
    currentPlayer = 1;
    gameActive = true;
    timeRemaining = TIME_LIMIT;
    usedWords = [];
    document.getElementById("log").innerHTML = "";
    document.getElementById("wordInput").value = "";
    document.getElementById("wordInput").disabled = false;
    document.querySelector("button[onclick='sendWord()']").disabled = false;
    document.getElementById("resetBtn").style.display = "none";
    document.getElementById("modelLoadBtn").style.display = "none";
    updateDanger(0);
    updateTurnDisplay();
    document.getElementById("similarityText").innerText = "危険度 0.0%";
    updateTimerDisplay();
    document.getElementById("wordInput").focus();
}

window.addEventListener("load", function() {
    // 初期状態: 入力フィールドとボタンを無効化
    document.getElementById("wordInput").disabled = true;
    document.querySelector("button[onclick='sendWord()']").disabled = true;
    
    updateTurnDisplay();
    updateTimerDisplay();
    
    document.getElementById("wordInput").addEventListener("keypress", function(e) {
        if(e.key === "Enter") {
            sendWord();
        }
    });
});