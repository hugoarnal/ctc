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

const TEXT_COLOR = {
    "red": "white",
    "blue": "white",
    "purple": "white",
    "yellow": "black",
    "pink": "black",
};

var id;
var captcha;
var spawned_fruits = [];
var caught_fruits = [];
var pad;

const ctx = canvas.getContext("2d");

const FRUIT_RADIUS = 10;
class Fruit {
    constructor(i = 0, letter) {
        this.radius = FRUIT_RADIUS;
        this.i = i;
        this.x = Math.floor(Math.random() * WIDTH - 10) + 10;
        this.y = (i * -20) - this.radius;
        this.color = COLORS[Math.floor(Math.random() * COLORS.length)];
        this.letter = letter;
        this.speed = Math.random() + 0.25;
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, 2 * Math.PI);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = TEXT_COLOR[this.color];
        ctx.font = `15px serif`;
        ctx.textAlign = "center";
        ctx.fillText(`${this.letter}`, this.x, this.y + 5);
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
            if (e.code == "ArrowLeft" && this.x - this.speed + this.width >= 0) {
                this.x -= this.speed;
            }
            if (e.code == "ArrowRight" && this.x + this.speed <= WIDTH) {
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

function get_caught_captcha() {
    let caught_captcha = "";
    caught_fruits.forEach((fruit) => {
        caught_captcha += fruit.letter;
    });
    return caught_captcha;
}

function complete() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.font = `${FONT_SIZE}px serif`;
    ctx.textAlign = "center";
    ctx.fillStyle = "black";
    ctx.fillText(`Sending captcha...`, WIDTH / 2, HEIGHT / 2);

    fetch(`${API_URL}/resolve`, {
        method: "POST",
        headers: {
            "Accept": "application/json",
            "Content-Type": "application/json"
        },
        body: JSON.stringify({id: id, captcha: get_caught_captcha()})
    })
    .then((data) => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            switch (data.status) {
                case 200:
                    ctx.fillStyle = "green";
                    ctx.fillText(`Success!`, WIDTH / 2, HEIGHT / 2);
                    submit.removeAttribute("disabled");
                    break;
                case 400:
                    ctx.fillStyle = "red";
                    ctx.fillText(`Incorrect captcha`, WIDTH / 2, HEIGHT / 2);
                    setTimeout(() => {
                        requestAnimationFrame(main);
                    }, 2000);
                    break;
                default:
                    ctx.fillStyle = "red";
                    ctx.fillText(`An error occured`, WIDTH / 2, HEIGHT / 2);
                    setTimeout(() => {
                        requestAnimationFrame(main);
                    }, 2000);
                    break;
            }
        });

}

function verify_y() {
    for (let i = 0; i < spawned_fruits.length; i++) {
        if (spawned_fruits[i].y > HEIGHT) {
            const new_fruit = new Fruit(spawned_fruits[i].i, spawned_fruits[i].letter);
            spawned_fruits.splice(i, 1);
            spawned_fruits.push(new_fruit);
        }
    }
}

function check_bounds() {
    for (let i = 0; i < spawned_fruits.length; i++) {
        const fruit = spawned_fruits[i];
        if (fruit.x >= pad.x && fruit.x <= pad.x + pad.width && fruit.y >= pad.y && fruit.y <= pad.y + pad.height) {
            caught_fruits.push(fruit);
            spawned_fruits.splice(i, 1);
        }
    }
}

function update() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.font = `${FONT_SIZE}px serif`;
    ctx.textAlign = "left";
    ctx.fillText(`${captcha}`, 0, FONT_SIZE);
    ctx.fillText(`${get_caught_captcha()}`, 0, FONT_SIZE * 2);

    ctx.textAlign = "right";
    ctx.fillText(`${caught_fruits.length}/${CAPTCHA_SIZE}`, WIDTH, FONT_SIZE);

    pad.draw();

    for (let i = 0; i < spawned_fruits.length; i++) {
        spawned_fruits[i].draw();
        spawned_fruits[i].update();
    }
    verify_y();
    check_bounds();
    if (caught_fruits.length < CAPTCHA_SIZE) {
        setTimeout(() => {
            requestAnimationFrame(update);
        }, 20);
    } else {
        requestAnimationFrame(complete);
    }
}

let start_captcha = false;

function start() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.font = `${FONT_SIZE}px serif`;
    ctx.textAlign = "center";
    ctx.fillText(`Press V to start captcha!`, WIDTH / 2, HEIGHT / 2);
    canvas.addEventListener("keydown", (e) => {
        if (e.code == "KeyV") {
            start_captcha = true;
        }
    });
    if (start_captcha) {
        requestAnimationFrame(update);
    } else {
        requestAnimationFrame(start);
    }
}

function main() {
    start_captcha = false;
    spawned_fruits = [];
    caught_fruits = [];

    fetch(`${API_URL}/challenge`).then((data) => data.json()).then((res) => {
        id = res["id"];
        captcha = atob(res["captcha"]);
        pad = new Pad();

        create_fruits(captcha);
        requestAnimationFrame(start);
    });
}

window.onload = () => {
    main();
};
