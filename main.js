
const SIDES = 6;                 //numero de lados del polígono
const RECURSION_LEVELS = 5;      //nivel de recursión
const SCALE_FACTOR = 0.7;        //escala
const INITIAL_RADIUS = 150;      //radio

const canvas = document.getElementById('canvas');
const gl = canvas.getContext('webgl');

const vertexShaderSource = `
    attribute vec2 a_position;
    uniform vec2 u_resolution;

    void main() {
        vec2 zeroToOne = a_position / u_resolution;
        vec2 zeroToTwo = zeroToOne * 2.0;
        vec2 clipSpace = zeroToTwo - 1.0;
        gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
    }
`;

const fragmentShaderSource = `
    precision mediump float;
    uniform vec4 u_color;
    
    void main() {
        gl_FragColor = u_color;
    }
`;

function createShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    return shader;
}

function createProgram(gl, vertexShader, fragmentShader) {
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    return program;
}

const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
const program = createProgram(gl, vertexShader, fragmentShader);

const positionLocation = gl.getAttribLocation(program, "a_position");
const resolutionLocation = gl.getUniformLocation(program, "u_resolution");
const colorLocation = gl.getUniformLocation(program, "u_color");
const positionBuffer = gl.createBuffer();

function calculateVertices(centerX, centerY, radius, sides) {
    const vertices = [];
    const angleStep = (2 * Math.PI) / sides;
    for (let i = 0; i < sides; i++) {
        const angle = i * angleStep;
        const x = centerX + radius * Math.cos(angle);
        const y = centerY + radius * Math.sin(angle);
        vertices.push(x, y);
    }
    return vertices;
}

function vertexesToTriangles(vertices, centerX, centerY) {
    const triangles = [];
    const numVertices = vertices.length / 2;
    for (let i = 0; i < numVertices; i++) {
        const current = i * 2;
        const next = ((i + 1) % numVertices) * 2;
        triangles.push(
            centerX, centerY,
            vertices[current], vertices[current + 1],
            vertices[next], vertices[next + 1]
        );
    }
    return triangles;
}

function drawRecursivePolygons(centerX, centerY, radius, level) {
    if (level > RECURSION_LEVELS) {
        return;
    }
    const vertices = calculateVertices(centerX, centerY, radius, SIDES);
    const triangles = vertexesToTriangles(vertices, centerX, centerY);
    const intensity = 1.0 - (level - 1) / RECURSION_LEVELS;
    const color = [0.3 + intensity * 0.4, 0.6 + intensity * 0.4, 1.0, 0.8];
    drawPolygon(triangles, color);
    const nextRadius = radius * SCALE_FACTOR;
    drawRecursivePolygons(centerX, centerY, nextRadius, level + 1);
}

function drawPolygon(triangles, color) {
    gl.useProgram(program);
    gl.uniform2f(resolutionLocation, canvas.width, canvas.height);
    gl.uniform4fv(colorLocation, color);
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(triangles), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.TRIANGLES, 0, triangles.length / 2);
}

function init() {
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    drawRecursivePolygons(centerX, centerY, INITIAL_RADIUS, 1);
}

init();