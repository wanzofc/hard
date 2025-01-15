const express = require('express');
const path = require('path');
const app = express();
const port = 8080;

// Inisialisasi data game
let gameData = {
    money: 100,
    lives: 10,
    level: 1,
    maxLevel: 200,
    towerCost: 50,
    enemies: [],
    towers: [],
    path: [
        { x: 0, y: 200 },
        { x: 700, y: 200 },
    ],
    cellSize: 50,
    lastUpdate: Date.now(),
    targetFPS: 60,
     wave: 1,
     difficulty: 'easy'
};


// Function to update game data
function updateGameData(deltaTime) {
    // Update enemies
    for (let i = gameData.enemies.length - 1; i >= 0; i--) {
        gameData.enemies[i].update(deltaTime);
    }

    // Update towers
    gameData.towers.forEach(tower => {
        tower.update(deltaTime);
    });


    // remove enemies
    gameData.enemies = gameData.enemies.filter(enemy => enemy.hp > 0 && enemy.x < 800);


    if(gameData.enemies.length === 0){
         if(gameData.level < gameData.maxLevel){
           gameData.wave++;
            startWave();
             gameData.level++
            adjustDifficulty()
            console.log(`level: ${gameData.level}, difficulty: ${gameData.difficulty}, money: ${gameData.money}`)
        }
     
    }
}

function adjustDifficulty() {
  if (gameData.level <= 50) {
        gameData.difficulty = 'easy';
    } else if (gameData.level <= 100) {
         gameData.difficulty = 'medium';
    } else if (gameData.level <= 150) {
         gameData.difficulty = 'hard';
    } else {
         gameData.difficulty = 'very hard';
   }
}
function startWave(){
  
    for(let i = 0; i < 2 * gameData.wave; i++){
         const initialEnemyX = gameData.path[0].x;
        const initialEnemyY = gameData.path[0].y;
       
         const hp =  gameData.difficulty === 'easy' ? 10 : gameData.difficulty === 'medium' ? 20 : gameData.difficulty === 'hard' ? 30 : 40
         const speed =  gameData.difficulty === 'easy' ? 1 : gameData.difficulty === 'medium' ? 1.5 : gameData.difficulty === 'hard' ? 2 : 2.5

         gameData.enemies.push(new Enemy(initialEnemyX, initialEnemyY, speed, hp, 'blue'));
        }
}

// function to calculate game data and send it to the client
app.get('/gameData', (req, res) => {
    // Calculate time elapsed
   const now = Date.now();
    const deltaTime = (now - gameData.lastUpdate) / 1000;

    if(deltaTime >= 1/gameData.targetFPS){
        updateGameData(deltaTime)
        gameData.lastUpdate = now;
     }

    res.json({
        money: gameData.money,
        lives: gameData.lives,
        level: gameData.level,
        maxLevel: gameData.maxLevel,
        towerCost: gameData.towerCost,
        enemies: gameData.enemies,
        towers: gameData.towers,
         path: gameData.path,
        cellSize: gameData.cellSize,
         wave: gameData.wave,
         difficulty: gameData.difficulty
    });

});

// POST endpoint for placing a tower
app.post('/placeTower', express.json(), (req, res) => {
    const {x, y, towerType} = req.body;
       let towerCost = towerType === 'basic' ? 50 : 70
    if (gameData.money >= towerCost) {
        gameData.towers.push(new Tower(x, y, towerType));
        gameData.money -= towerCost
           res.status(200).json({ message: 'Tower placed successfully' });
    }else{
       res.status(400).json({message: 'Not enough money'})
    }

})
// Endpoint to reset game (optional)
app.post('/resetGame', (req, res) => {
    gameData = {
        money: 100,
        lives: 10,
        level: 1,
        maxLevel: 200,
        towerCost: 50,
        enemies: [],
        towers: [],
        path: [
            { x: 0, y: 200 },
             { x: 700, y: 200 },
         ],
           cellSize: 50,
           lastUpdate: Date.now(),
          targetFPS: 60,
         wave: 1,
         difficulty: 'easy'
    };
    res.status(200).json({ message: 'Game reset' });
});


// Serve static files
app.use(express.static(path.join(__dirname)));

// Route for index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

class Enemy {
        constructor(x, y, speed, hp, color) {
            this.x = x;
            this.y = y;
            this.speed = speed;
            this.hp = hp;
            this.maxHp = hp;
            this.color = color;
            this.pathIndex = 0;
            this.size = 25;
            this.height = 35;
           
        }
          update(deltaTime){
                if(this.pathIndex < gameData.path.length-1){
                    const target = gameData.path[this.pathIndex+1];

                    const dx = target.x - this.x;
                    const dy = target.y - this.y;

                    const distance = Math.sqrt(dx * dx + dy * dy);


                     if(distance < 2){
                       this.pathIndex++;
                     }else {
                        this.x += (dx / distance) * this.speed * gameData.targetFPS * deltaTime
                        this.y += (dy / distance) * this.speed * gameData.targetFPS * deltaTime

                     }
                     

                }else{
                     // reduce lives
                      if(gameData.lives > 0){
                         gameData.lives--;
                      }
                   
                     this.hp = 0;
                }


             }
    }

  class Tower{
             constructor(x, y, towerType){
                this.x = x;
                this.y = y;
                  this.towerType = towerType;
                 this.size = 30;
                 this.range = towerType === 'basic' ? 120 : 150;
                 this.damage = towerType === 'basic' ? 1 : 2;
                this.color = 'green'
                this.rotation = 0;
                this.attackCooldown = towerType === 'basic' ? 1 : 0.8 ; // Attack speed
                this.attackTimer = 0;
                this.gunLength = 20;
                this.gunWidth = 4;

             }
              update(deltaTime){
                 
                    let target = null;
                     let minDistance = Infinity;
                   
                   for (const enemy of gameData.enemies) {
                      const dx = enemy.x - this.x;
                      const dy = enemy.y - this.y;
                      const distance = Math.sqrt(dx*dx + dy*dy)

                       if(distance <= this.range && distance < minDistance){
                           minDistance = distance;
                         target = enemy;
                         
                       }
                    }

                    if(target){
                         this.rotation = Math.atan2(target.y - this.y, target.x - this.x);
                          if (this.attackTimer <= 0) {
                            target.hp -= this.damage;
                            addExplosion(target.x, target.y); // add explosion effect
                           this.attackTimer = this.attackCooldown;
                        }else{
                           this.attackTimer-=deltaTime;
                        }
                    }
                 
             }
        }
      function addExplosion(x, y) {
        gameData.explosionEffects =  gameData.explosionEffects || []; // add explosionEffects to gameData if not exist
         gameData.explosionEffects.push({ x: x, y: y, radius: 10 });
       }


app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
    startWave();
});
