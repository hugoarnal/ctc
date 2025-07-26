const canvas = document.getElementById("ctc-captcha");
const submit = document.getElementById("submit");

const WIDTH = canvas.width;
const HEIGHT = canvas.height;

const ctx = canvas.getContext("2d");

ctx.fillStyle = "red";
ctx.fillRect(0, 0, WIDTH, HEIGHT);
