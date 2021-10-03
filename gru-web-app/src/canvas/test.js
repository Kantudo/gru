let test = () => {
var pen = {
    color: "rgba(255, 0, 0, 1.0)", // Set desired color
    size: 3                        // Set desired size
};

var pts = [];
var isDown = false;
var isTouch = false;
var cvs = document.getElementById('canvas');
// var cvs2 = document.createElement('canvas');
var ctx = cvs.getContext('2d');
// var ctx2 = cvs2.getContext('2d');

function setCvsSize() {
    // cvs.width = document.documentElement.clientWidth;
    // cvs.height = document.documentElement.clientHeight;
}

function penDown(ev) {
    // ev.preventDefault();
    // isTouch = ev.type === "touchstart";
    // ev = isTouch ? ev.touches[0] : ev;
    // isDown = true;
    // pts.push({
    //     x: ev.clientX,
    //     y: ev.clientY
    // });
    // drawPoints();
}

function penMove(ev) {
    // ev.preventDefault();
    // ev = isTouch ? ev.touches[0] : ev;
    // if (isDown) {
        ctx.clearRect(0, 0, cvs.width, cvs.height);
        // ctx.drawImage(cvs2, 0, 0); // Draw to inmemory cvs2
        pts.push({
        x: ev.clientX,
        y: ev.clientY
        });
        drawPoints();
    // }
}

function penUp(ev) {
    // ev.preventDefault();
    // isDown = isTouch = false;
    // pts = [];
    // // Save state to in-memory cvs2
    // ctx2.clearRect(0, 0, cvs.width, cvs.height);
    // ctx2.drawImage(cvs, 0, 0);
}

function clear() {
    ctx.clearRect(0, 0, cvs.width, cvs.height);
    // ctx2.clearRect(0, 0, cvs.width, cvs.height);
}

function drawPoints() {
    var i = 0;
    var i2 = pts.length > 1 ? 1 : 0;
    ctx.beginPath();
    ctx.lineWidth = pen.size;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.moveTo(pts[0].x, pts[0].y);
    for (; i < pts.length - i2; i++) {
        ctx.quadraticCurveTo(
        pts[i].x,
        pts[i].y,
        (pts[i].x + pts[i + i2].x) / 2,
        (pts[i].y + pts[i + i2].y) / 2
        );
    }
    ctx.strokeStyle = pen.color;
    ctx.stroke();
    ctx.closePath();
}

// EVENTS

cvs.addEventListener('touchstart', penDown);
cvs.addEventListener('mousedown', penDown);
cvs.addEventListener('touchmove', penMove);
cvs.addEventListener('mousemove', penMove);
cvs.addEventListener('touchend', penUp);
cvs.addEventListener('mouseup', penUp);
window.addEventListener('resize', setCvsSize);

// INIT
setCvsSize();
}
export default test