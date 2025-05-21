class Game {
  constructor() {
    //CANVAS untuk ukuran dari Game tersebut, kita ambil id element di HTMLnya
    this.canvas = document.getElementById("gameCanvas");
    this.ctx = this.canvas.getContext("2d");
    this.gameRunning = false;
    this.gameOver = false;
    this.score = 0;
    this.player = new Player(150, 500);
    this.backButton = {
      img: document.getElementById("backButtonImg"),
      x: 10,
      y: 30, // Tepat di bawah skor (score biasanya di y=20)
      width: 60,
      height: 30,
    };

    this.bgSound = document.getElementById("bgSound");

    this.aiCars = [];
    this.fuelItems = [];
    this.spawnAICars(4);
    this.keys = {};
    this.bgY = 0;
    this.bgSpeed = 10;
    this.finishLineY = -100; // posisi awal garis finish (di luar layar)
    this.showFinish = false; // apakah garis finish aktif
    this.finishScore = 200; // skor yang dibutuhkan untuk memunculkan garis finish
    // BUAT GARIS MAP
    this.roadLeftBound = 85;
    this.roadRightBound = 330;

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
    const availablePositions = [110, 230, 170, 260]; // Lajur posisi mobil AI
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
    if (this.gameRunning) {
      if (this.bgSound) {
        this.bgSound.currentTime = 0;
        this.bgSound.play();
      }
      this.update();
    } else {
      if (this.bgSound) {
        this.bgSound.pause();
      }
    }
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
    this.player.fuel = this.player.maxFuel;

    document.getElementById("finishOptions").style.display = "none";
    if (this.bgSound) {
      this.bgSound.currentTime = 0;
      this.bgSound.play();
    }

    this.update();
  }

  update() {
    if (!this.gameRunning || this.gameOver) return;

    this.bgY += this.bgSpeed;
    if (this.bgY >= this.canvas.height) this.bgY = 0;

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.drawBackground();

    this.player.move(this.keys, this.canvas.width, this.canvas.height, this);

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

    // 🔥 KURANGI BENSIN TERGANTUNG INPUT
    if (this.keys["w"] || this.keys["ArrowUp"]) {
      this.player.fuel -= 0.3; // Kurangi lebih cepat saat gas ditekan
    } else {
      this.player.fuel -= 0.05; // Idle drain
    }

    this.player.fuel = Math.max(0, this.player.fuel); // Cegah negatif

    if (this.player.fuel <= 0) {
      this.endGame("Out of Fuel!");
      return;
    }

    // Spawn fuel item secara acak
    if (Math.random() < 0.01) {
      let possibleLanes = [120, 180, 240, 320];
      let randomX =
        possibleLanes[Math.floor(Math.random() * possibleLanes.length)];
      this.fuelItems.push(new FuelItem(randomX, -30));
    }

    this.fuelItems.forEach((item, index) => {
      item.move(this.bgSpeed);

      if (this.checkCollision(this.player, item)) {
        this.player.fuel = Math.min(this.player.maxFuel, this.player.fuel + 30);

        // Mainkan SFX
        const fuelSfx = document.getElementById("fuel-sfx");
        if (fuelSfx) {
          fuelSfx.currentTime = 0; // agar bisa dimainkan berulang
          fuelSfx.play();
        }

        this.fuelItems.splice(index, 1);
      }

      if (item.y > this.canvas.height) {
        this.fuelItems.splice(index, 1);
      }
    });

    if (this.showFinish) {
      this.finishLineY += this.bgSpeed;

      if (
        this.player.y < this.finishLineY + 10 &&
        this.player.y + this.player.height > this.finishLineY
      ) {
        this.endGame("FINISH LINE REACHED!");
        localStorage.setItem("level1Completed", "true");
        console.log(localStorage.getItem("level1Completed"));
        const finishSfx = document.getElementById("finish-sfx");
        if (finishSfx) {
          finishSfx.currentTime = 0;
          finishSfx.play();
        }
      }
    }

    this.draw();
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
    this.fuelItems.forEach((item) => item.draw(this.ctx));

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

    // Fuel bar UI
    let barX = 100;
    let barY = 10;
    let barWidth = 100;
    let barHeight = 10;
    let percent = this.player.fuel / this.player.maxFuel;

    this.ctx.fillStyle = "gray";
    this.ctx.fillRect(barX, barY, barWidth, barHeight); // Background bar

    this.ctx.fillStyle = percent > 0.3 ? "lime" : "red"; // Warna berubah jika bensin rendah
    this.ctx.fillRect(barX, barY, barWidth * percent, barHeight); // Isi bensin

    this.ctx.strokeStyle = "white";
    this.ctx.strokeRect(barX, barY, barWidth, barHeight); // Border

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

  checkCollision(obj1, obj2) {
    const a = obj1.getHitbox();
    const b = obj2.getHitbox();

    return (
      a.x < b.x + b.width &&
      a.x + a.width > b.x &&
      a.y < b.y + b.height &&
      a.y + a.height > b.y
    );
  }

  endGame(message = "GAME OVER") {
    this.gameOver = true;
    this.gameRunning = false;

    if (this.bgSound) {
      this.bgSound.pause();
      this.bgSound.currentTime = 0;
    }

    if (message === "FINISH LINE REACHED!") {
      document.getElementById("finishOptions").style.display = "block";
    } else {
      const over = document.getElementById("gameOver");
      over.innerHTML = message + "<br>Click to Restart";
      over.style.display = "block";

      // Mainkan SFX tabrakan jika bukan karena kehabisan bensin
      if (message !== "Out of Fuel!") {
        const crashSfx = document.getElementById("crash-sfx");
        if (crashSfx) {
          crashSfx.currentTime = 0;
          crashSfx.play();
        }
      }
    }
  }
}

class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 40;
    this.height = 60;
    this.speed = 5;
    const pilihan = localStorage.getItem("mobilDipilih");
    switch (pilihan) {
      case "1":
        this.image = document.getElementById("truck1");
        break;
      case "2":
        this.image = document.getElementById("truck2");
        break;
      case "3":
        this.image = document.getElementById("truck3");
        break;
      case "4":
        this.image = document.getElementById("truck4");
        break;
      case "5":
        this.image = document.getElementById("truck5");
        break;
      default:
        this.image = document.getElementById("player"); // default image
    }

    this.fuel = 100; // max 100
    this.maxFuel = 100;

    // Hitbox offset
    this.hitboxOffsetX = 5;
    this.hitboxOffsetY = 10;
    this.hitboxWidth = this.width - 10; // misalnya: 30px
    this.hitboxHeight = this.height - 20; // misalnya: 40px
  }

  getHitbox() {
    return {
      x: this.x + this.hitboxOffsetX,
      y: this.y + this.hitboxOffsetY,
      width: this.hitboxWidth,
      height: this.hitboxHeight,
    };
  }

  move(keys, canvasWidth, canvasHeight, game) {
    if (keys["ArrowLeft"] || keys["a"]) this.x -= this.speed;
    if (keys["ArrowRight"] || keys["d"]) this.x += this.speed;
    if (keys["ArrowUp"] || keys["w"]) this.y -= this.speed;
    if (keys["ArrowDown"] || keys["s"]) this.y += this.speed;

    // Batasi hanya di dalam pembatas jalan
    if (game) {
      this.x = Math.max(
        game.roadLeftBound,
        Math.min(game.roadRightBound - this.width, this.x)
      );
    } else {
      this.x = Math.max(0, Math.min(canvasWidth - this.width, this.x));
    }

    // Batas atas dan bawah
    if (this.y <= 0) {
      this.y = Math.random() * (canvasHeight - this.height);
      if (game) game.score += 50;
    }
    this.y = Math.max(0, Math.min(canvasHeight - this.height, this.y));
  }

  //untuk ambil gambar dari player
  draw(ctx) {
    ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
    // Debug: Gambar hitbox
    ctx.strokeStyle = "red";
    const hb = this.getHitbox();
    ctx.strokeRect(hb.x, hb.y, hb.width, hb.height);
  }
}

class Car {
  constructor(x, y, speed) {
    this.x = x;
    this.y = y;
    this.width = 40;
    this.height = 60;
    this.speed = speed;

    this.hitboxOffsetX = 5;
    this.hitboxOffsetY = 10;
    this.hitboxWidth = this.width - 10;
    this.hitboxHeight = this.height - 20;

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

  getHitbox() {
    return {
      x: this.x + this.hitboxOffsetX,
      y: this.y + this.hitboxOffsetY,
      width: this.hitboxWidth,
      height: this.hitboxHeight,
    };
  }

  move() {
    this.y += this.speed;
  }

  draw(ctx) {
    ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
    // Debug: Gambar hitbox
    const hb = this.getHitbox();
    ctx.strokeStyle = "red";
    ctx.strokeRect(hb.x, hb.y, hb.width, hb.height);
  }
}

class FuelItem {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 30;
    this.height = 30;
    this.image = document.getElementById("fuelImg");
  }

  move(speed) {
    this.y += speed;
  }

  draw(ctx) {
    ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
  }

  getHitbox() {
    return {
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
    };
  }
}

const game = new Game();
console.log(this.score);
