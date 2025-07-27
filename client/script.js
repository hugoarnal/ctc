const API_URL = "http://localhost:8080"

const canvas = document.getElementById("ctc-captcha");
const submit = document.getElementById("submit");

const WIDTH = canvas.width;
const HEIGHT = canvas.height;
const FONT_SIZE = 20;
const CAPTCHA_SIZE = 7;

const COLORS = [
    "red",
    "blue",
    "purple",
    "yellow",
    "pink"
];

var captcha;
var spawned_fruits = [];
var caught_fruits = [];
var pad;

const ctx = canvas.getContext("2d");

const FRUIT_RADIUS = 10;
class Fruit {
    constructor(i = 0, letter) {
        this.radius = FRUIT_RADIUS;
        this.x = Math.floor(Math.random() * WIDTH - 10) + 10;
        this.y = (i * -20) - this.radius;
        this.color = COLORS[Math.floor(Math.random() * COLORS.length)];
        this.letter = letter;
        this.speed = Math.random();
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, 2 * Math.PI);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = "black";
    }

    update() {
        this.y += this.speed;
    }
}

class Pad {
    constructor() {
        this.width = 50;
        this.height = 10;
        this.x = WIDTH / 2 - (this.width / 2);
        this.y = HEIGHT - 50;
        this.color = "black";
        this.speed = 10;

        canvas.addEventListener("keydown", (e) => {
            if (e.code == "ArrowLeft") {
                this.x -= this.speed;
            }
            if (e.code == "ArrowRight") {
                this.x += this.speed;
            }
        });
    }

    draw() {
        ctx.beginPath();
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }
}

function create_fruits(captcha) {
    for (let i = 0; i < CAPTCHA_SIZE; i++) {
        let fruit = new Fruit(i, captcha[i]);
        spawned_fruits.push(fruit);
        fruit.draw();
    }
}

function send_request() {
    console.log("todo");
}

function verify_y() {
    for (let i = 0; i < spawned_fruits.length; i++) {
        if (spawned_fruits[i].y > HEIGHT) {
            spawned_fruits.splice(i, 1);
        }
    }
}

function update() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.font = `${FONT_SIZE}px serif`;
    ctx.textAlign = "left"
    ctx.fillText(`${captcha}`, 0, FONT_SIZE);

    ctx.textAlign = "right"
    ctx.fillText(`${caught_fruits.length}/${CAPTCHA_SIZE}`, WIDTH, FONT_SIZE);

    pad.draw();

    for (let i = 0; i < spawned_fruits.length; i++) {
        spawned_fruits[i].draw();
        spawned_fruits[i].update();
    }
    verify_y();
    if (caught_fruits.length < CAPTCHA_SIZE) {
        setTimeout(() => {
            requestAnimationFrame(update);
        }, 20);
    } else {
        send_request();
    }
}

async function main() {
    const req = await fetch(`${API_URL}/challenge`);
    const res = await req.json();

    captcha = atob(res["captcha"]);
    pad = new Pad();

    create_fruits(captcha);
    requestAnimationFrame(update);
}

main().then(() => {});
