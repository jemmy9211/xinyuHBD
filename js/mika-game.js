document.addEventListener('DOMContentLoaded', function() {
    const bear = document.querySelector('.bear');
    const scene = document.querySelector('.scene');
    const scoreDisplay = document.querySelector('.score');
    const timerDisplay = document.querySelector('.timer');
    const gameOverScreen = document.querySelector('.game-over');
    const finalScoreDisplay = document.querySelector('.final-score');
    
    let score = 0;
    let timeRemaining = 60;
    let gameActive = true;
    let fishInterval;
    let timerInterval;
    
    // Create splash effect
    function createSplash(x, y) {
        const splash = document.createElement('div');
        splash.className = 'splash';
        splash.style.left = (x - 40) + 'px';
        splash.style.top = (y - 40) + 'px';
        scene.appendChild(splash);
        
        setTimeout(() => {
            scene.removeChild(splash);
        }, 500);
    }
    
    // Create and animate fish
    function createFish() {
        if (!gameActive) return;
        
        const fish = document.createElement('div');
        fish.className = 'fish';
        
        // Random position in water with more variation
        const sceneHeight = scene.clientHeight;
        const minFishY = sceneHeight * 0.5;  // Above water level
        const maxFishY = sceneHeight * 0.8;  // Below water level
        const fishY = minFishY + Math.random() * (maxFishY - minFishY);
        
        fish.style.top = fishY + 'px';
        fish.style.right = '-60px';
        scene.appendChild(fish);
        
        // Animation variables
        let position = -60;
        const speed = 2 + Math.random() * 3;
        let wiggle = 0;
        const wiggleAmount = 2 + Math.random() * 8; // More random movement
        
        function swimFish() {
            if (!gameActive) {
                scene.removeChild(fish);
                return;
            }
            
            if (position > window.innerWidth) {
                scene.removeChild(fish);
                return;
            }
            
            position += speed;
            wiggle += 0.1;
            const wiggleY = Math.sin(wiggle) * wiggleAmount;
            
            fish.style.right = position + 'px';
            fish.style.top = (fishY + wiggleY) + 'px';
            
            // Check if fish is near bear
            const bearRect = bear.getBoundingClientRect();
            const fishRect = fish.getBoundingClientRect();
            
            if (fishRect.right > bearRect.left && 
                fishRect.left < bearRect.right && 
                fishRect.top > bearRect.top &&
                fishRect.bottom < bearRect.bottom + 100) {
                
                // Bear catches the fish
                scene.removeChild(fish);
                bear.classList.add('catching');
                
                // Create splash effect
                createSplash(fishRect.left, fishRect.top);
                
                // Update score
                score++;
                scoreDisplay.textContent = `捕獲: ${score}`;
                
                setTimeout(() => {
                    bear.classList.remove('catching');
                }, 300);
                
                return;
            }
            
            requestAnimationFrame(swimFish);
        }
        
        swimFish();
    }
    
    // Start game timer
    function startTimer() {
        timerInterval = setInterval(() => {
            timeRemaining--;
            timerDisplay.textContent = `時間: ${timeRemaining}`;
            
            if (timeRemaining <= 0) {
                endGame();
            }
        }, 1000);
    }
    
    // End the game
    function endGame() {
        gameActive = false;
        clearInterval(fishInterval);
        clearInterval(timerInterval);
        
        finalScoreDisplay.textContent = `你捕獲了 ${score} 條鮭魚!`;
        gameOverScreen.style.display = 'flex';
    }
    
    // Keyboard controls for the bear
    document.addEventListener('keydown', (e) => {
        if (!gameActive) return;
        
        const bearRect = bear.getBoundingClientRect();
        const sceneRect = scene.getBoundingClientRect();
        const bearWidth = bearRect.width;
        const bearHeight = bearRect.height;
        
        // Current position calculation
        const currentLeft = parseInt(bear.style.left) || 10;
        const currentBottom = parseInt(bear.style.bottom) || 20;
        
        // Movement step
        const step = 20;
        
        switch(e.key) {
            // Move bear left
            case 'ArrowLeft':
                const newLeftPosition = Math.max(0, currentLeft - step);
                bear.style.left = newLeftPosition + '%';
                break;
            
            // Move bear right
            case 'ArrowRight':
                const newRightPosition = Math.min(80, currentLeft + step);
                bear.style.left = newRightPosition + '%';
                break;
            
            // Move bear up
            case 'ArrowUp':
                const newUpPosition = Math.min(60, currentBottom + step);
                bear.style.bottom = newUpPosition + '%';
                break;
            
            // Move bear down
            case 'ArrowDown':
                const newDownPosition = Math.max(10, currentBottom - step);
                bear.style.bottom = newDownPosition + '%';
                break;
        }
    });
    
    // Initialize the game
    function initGame() {
        score = 0;
        timeRemaining = 60;
        gameActive = true;
        
        // Reset bear position
        bear.style.left = '10%';
        bear.style.bottom = '20%';
        
        scoreDisplay.textContent = `捕獲: ${score}`;
        timerDisplay.textContent = `時間: ${timeRemaining}`;
        gameOverScreen.style.display = 'none';
        
        // Create fish at random intervals
        fishInterval = setInterval(createFish, 1200 + Math.random() * 800);
        
        // Start timer
        startTimer();
        
        // Initial fish
        createFish();
    }
    
    // Restart the game
    window.restartGame = function() {
        initGame();
    };
    
    // Go to home page
    window.goToHomePage = function() {
        window.location.href = 'index.html';
    };
    
    // Initialize the game when page loads
    initGame();
});
