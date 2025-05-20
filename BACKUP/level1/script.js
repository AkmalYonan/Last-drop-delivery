class Game {
  constructor() {
    //CANVAS untuk ukuran dari Game tersebut, kita ambil id element di HTMLnya
    this.canvas = document.getElementById("gameCanvas");
    this.ctx = this.canvas.getContext("2d");
    this.gameRunning = false;
    this.gameOver = false;
    this.score = 0;
    this.player = new Player(180, 500);
    this.backButton = {
      img: document.getElementById("backButtonImg"),
      x: 10,
      y: 30, // Tepat di bawah skor (score biasanya di y=20)
      width: 60,
      height: 30,
    };

    this.aiCars = [];
    this.spawnAICars(4);
    this.keys = {};
    this.bgY = 0;
    this.bgSpeed = 10;
    this.finishLineY = -100; // posisi awal garis finish (di luar layar)
    this.showFinish = false; // apakah garis finish aktif
    this.finishScore = 200; // skor yang dibutuhkan untuk memunculkan garis finish

    this.init();
  }

  // get score() {
  //   return this._score;
  // }

  // set score(value) {
  //   if (value < 0) {
  //     return;
  //   }
  //   this._score = value;
  // }

  init() {
    document.addEventListener("keydown", (e) => (this.keys[e.key] = true));
    document.addEventListener("keyup", (e) => (this.keys[e.key] = false));
    this.canvas.addEventListener("click", (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      // Cek jika klik di area tombol back
      const b = this.backButton;
      if (
        mouseX >= b.x &&
        mouseX <= b.x + b.width &&
        mouseY >= b.y &&
        mouseY <= b.y + b.height
      ) {
        history.back();
        return;
      }

      if (this.gameOver) this.resetGame();
    });
  }

  spawnAICars(count) {
    const availablePositions = [120, 180, 240, 320]; // Lajur posisi mobil AI
    this.aiCars = [];

    for (let i = 0; i < count; i++) {
      if (availablePositions.length === 0) break; // Jika tidak ada tempat, stop

      let randomIndex = Math.floor(Math.random() * availablePositions.length);
      let x = availablePositions[randomIndex];
      availablePositions.splice(randomIndex, 1); // Hapus posisi yang sudah dipakai

      let y = -Math.random() * 600; // Spawn di luar layar dengan jarak acak
      let speed = Math.random() * 2 + 3; // Kecepatan antara 3-5

      this.aiCars.push(new Car(x, y, speed));
    }
  }

  toggleGame() {
    this.gameRunning = !this.gameRunning;
    if (this.gameRunning) this.update();
  }

  resetGame() {
    this.player.y = 500;
    this.score = 0;
    this.aiCars.forEach((car) => (car.y = -Math.random() * 300));
    this.gameOver = false;
    document.getElementById("gameOver").style.display = "none";
    this.gameRunning = true;
    this.bgY = 0;
    this.showFinish = false;
    this.finishLineY = -100;

    this.update();
  }

  update() {
    if (!this.gameRunning || this.gameOver) return;

    this.bgY += this.bgSpeed;
    if (this.bgY >= this.canvas.height) this.bgY = 0;

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.drawBackground();

    this.player.move(this.keys, this.canvas.width, this.canvas.height);

    this.aiCars.forEach((car) => {
      car.move();
      if (car.y > this.canvas.height) {
        car.y = -Math.random() * 300;
        this.score += 10;
        console.log(`Score: ${this.score}`);
      }
      if (this.checkCollision(this.player, car)) this.endGame();
    });

    if (this.score >= this.finishScore && !this.showFinish) {
      this.showFinish = true;
      this.finishLineY = -100; // Mulai dari atas layar
    }

    if (this.showFinish) {
      this.finishLineY += this.bgSpeed; // Geser ke bawah seperti background

      // Jika player melewati garis finish, akhiri level
      if (
        this.player.y < this.finishLineY + 10 &&
        this.player.y + this.player.height > this.finishLineY
      ) {
        this.endGame("FINISH LINE REACHED!");
      }
    }

    this.draw();
    //untuk Animasi ketika function update setiap kali dijalankan. Berfungsi untuk menggerakan map / gambar Background
    requestAnimationFrame(() => this.update());
  }

  drawBackground() {
    const bg = document.getElementById("backgroundImg");
    this.ctx.drawImage(bg, 0, this.bgY, this.canvas.width, this.canvas.height);
    this.ctx.drawImage(
      bg,
      0,
      this.bgY - this.canvas.height,
      this.canvas.width,
      this.canvas.height
    );
  }

  draw() {
    this.player.draw(this.ctx);
    this.aiCars.forEach((car) => car.draw(this.ctx));

    // Gambar skor
    this.ctx.fillStyle = "white";
    this.ctx.font = "16px Arial";
    this.ctx.fillText(`Score: ${this.score}`, 10, 20);

    // Gambar tombol Back di canvas
    this.ctx.drawImage(
      this.backButton.img,
      this.backButton.x,
      this.backButton.y,
      this.backButton.width,
      this.backButton.height
    );

    if (this.showFinish) {
      this.ctx.fillStyle = "white";
      this.ctx.fillRect(0, this.finishLineY, this.canvas.width, 10);

      this.ctx.font = "bold 20px Arial";
      this.ctx.fillStyle = "yellow";
      this.ctx.fillText(
        "FINISH",
        this.canvas.width / 2 - 40,
        this.finishLineY - 5
      );
    }
  }

  checkCollision(rect1, rect2) {
    return (
      rect1.x < rect2.x + rect2.width &&
      rect1.x + rect2.width > rect2.x &&
      rect1.y < rect2.y + rect2.height &&
      rect1.y + rect1.height > rect2.y
    );
  }

  endGame(message = "GAME OVER") {
    this.gameOver = true;
    const over = document.getElementById("gameOver");
    over.innerHTML = message + "<br>Click to Restart";
    over.style.display = "block";
    this.gameRunning = false;
  }
}

class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 40;
    this.height = 60;
    this.speed = 5;
    this.image = document.getElementById("player");
  }

  move(keys, canvasWidth, canvasHeight, game) {
    // Tambahkan game sebagai parameter
    if (keys["ArrowLeft"] || keys["a"]) this.x -= this.speed;
    if (keys["ArrowRight"] || keys["d"]) this.x += this.speed;
    if (keys["ArrowUp"] || keys["w"]) this.y -= this.speed;
    if (keys["ArrowDown"] || keys["s"]) this.y += this.speed;

    // Batas layar horizontal
    this.x = Math.max(0, Math.min(canvasWidth - this.width, this.x));

    // Jika mencapai batas atas, teleport ke bawah dan tambah skor
    if (this.y <= 0) {
      this.y = Math.random() * (canvasHeight - this.height); // Reset ke posisi awal
      if (game) {
        game.score += 50; // Tambahkan skor
        console.log("Player teleport ke posisi awal! Score:", game.score);
      }
    }

    // Batas bawah
    this.y = Math.max(0, Math.min(canvasHeight - this.height, this.y));
  }
  //untuk ambil gambar dari player
  draw(ctx) {
    ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
  }
}

class Car {
  constructor(x, y, speed) {
    this.x = x;
    this.y = y;
    this.width = 40;
    this.height = 60;
    this.speed = speed;

    //ambil array npc
    const carImages = [
      document.getElementById("npc1"),
      document.getElementById("npc2"),
      document.getElementById("npc3"),
      document.getElementById("npc4"),
    ];

    // Pilih gambar secara acak untuk spawn npc
    this.image = carImages[Math.floor(Math.random() * carImages.length)];
  }

  move() {
    this.y += this.speed;
  }

  draw(ctx) {
    ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
  }
}

const game = new Game();
console.log(this.score);
