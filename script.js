// ===== CONSTANTS =====
const FUNCTIONS = ['sin', 'cos', 'tan', 'log', 'sqrt', 'abs'];
const CONSTANTS = { 'pi': Math.PI, 'π': Math.PI, 'e': Math.E };
const PRECEDENCE = { '+': 1, '-': 1, '*': 2, '/': 2, '^': 3 };
const ASSOCIATIVITY = { '+': 'L', '-': 'L', '*': 'L', '/': 'L', '^': 'R' };

// ===== TOKENIZER =====
function tokenize(expr, allowVariables) {
    const tokens = [];
    let i = 0;
    let lastType = null;

    while (i < expr.length) {
        const ch = expr[i];

        if (/\s/.test(ch)) { i++; continue; }

        // Number
        if (/\d/.test(ch) || (ch === '.' && i + 1 < expr.length && /\d/.test(expr[i + 1]))) {
            let numStr = '';
            while (i < expr.length && (/\d/.test(expr[i]) || expr[i] === '.')) {
                numStr += expr[i++];
            }
            insertImplicitMult(tokens, lastType);
            tokens.push({ type: 'NUMBER', value: parseFloat(numStr) });
            lastType = 'NUMBER';
            continue;
        }

        // Identifiers
        if (/[a-zA-Zπ]/.test(ch)) {
            let name = '';
            while (i < expr.length && /[a-zA-Zπ]/.test(expr[i])) {
                name += expr[i++];
            }

            if (name in CONSTANTS) {
                insertImplicitMult(tokens, lastType);
                tokens.push({ type: 'NUMBER', value: CONSTANTS[name] });
                lastType = 'NUMBER';
                continue;
            }

            if (FUNCTIONS.includes(name)) {
                insertImplicitMult(tokens, lastType);
                tokens.push({ type: 'FUNCTION', value: name });
                lastType = 'FUNCTION';
                continue;
            }

            if (allowVariables && name === 'x') {
                insertImplicitMult(tokens, lastType);
                tokens.push({ type: 'VARIABLE', value: 'x' });
                lastType = 'VARIABLE';
                continue;
            }

            throw new Error(`未知标识符: ${name}`);
        }

        // Operators
        if ('+-*/^'.includes(ch)) {
            if (ch === '-' && isUnaryMinus(lastType)) {
                tokens.push({ type: 'UNARY_MINUS', value: 'neg' });
                lastType = 'UNARY_MINUS';
            } else {
                tokens.push({ type: 'OPERATOR', value: ch });
                lastType = 'OPERATOR';
            }
            i++;
            continue;
        }

        // Parentheses
        if (ch === '(') {
            insertImplicitMult(tokens, lastType);
            tokens.push({ type: 'LEFT_PAREN', value: '(' });
            lastType = 'LEFT_PAREN';
            i++;
            continue;
        }

        if (ch === ')') {
            tokens.push({ type: 'RIGHT_PAREN', value: ')' });
            lastType = 'RIGHT_PAREN';
            i++;
            continue;
        }

        if (ch === ',') {
            tokens.push({ type: 'COMMA', value: ',' });
            lastType = 'COMMA';
            i++;
            continue;
        }

        throw new Error(`无法识别的字符: "${ch}"`);
    }

    return tokens;
}

function insertImplicitMult(tokens, lastType) {
    if (lastType === 'NUMBER' || lastType === 'RIGHT_PAREN' || lastType === 'VARIABLE') {
        tokens.push({ type: 'OPERATOR', value: '*' });
    }
}

function isUnaryMinus(lastType) {
    return lastType === null || lastType === 'OPERATOR' ||
        lastType === 'FUNCTION' || lastType === 'LEFT_PAREN' ||
        lastType === 'COMMA' || lastType === 'UNARY_MINUS';
}

// ===== SHUNTING-YARD ALGORITHM =====
function shuntingYard(tokens) {
    const output = [];
    const opStack = [];

    for (const token of tokens) {
        switch (token.type) {
            case 'NUMBER':
            case 'VARIABLE':
                output.push(token);
                break;

            case 'FUNCTION':
            case 'UNARY_MINUS':
                opStack.push(token);
                break;

            case 'OPERATOR':
                while (opStack.length > 0) {
                    const top = opStack[opStack.length - 1];
                    if (top.type === 'OPERATOR' && (
                        (ASSOCIATIVITY[token.value] === 'L' && PRECEDENCE[token.value] <= PRECEDENCE[top.value]) ||
                        (ASSOCIATIVITY[token.value] === 'R' && PRECEDENCE[token.value] < PRECEDENCE[top.value])
                    )) {
                        output.push(opStack.pop());
                    } else {
                        break;
                    }
                }
                opStack.push(token);
                break;

            case 'LEFT_PAREN':
                opStack.push(token);
                break;

            case 'COMMA':
                while (opStack.length > 0 && opStack[opStack.length - 1].type !== 'LEFT_PAREN') {
                    output.push(opStack.pop());
                }
                if (opStack.length === 0) throw new Error('逗号位置错误');
                break;

            case 'RIGHT_PAREN':
                while (opStack.length > 0 && opStack[opStack.length - 1].type !== 'LEFT_PAREN') {
                    output.push(opStack.pop());
                }
                if (opStack.length === 0) throw new Error('括号不匹配');
                opStack.pop(); // Remove (
                if (opStack.length > 0 && opStack[opStack.length - 1].type === 'FUNCTION') {
                    output.push(opStack.pop());
                }
                break;
        }
    }

    while (opStack.length > 0) {
        const token = opStack.pop();
        if (token.type === 'LEFT_PAREN') throw new Error('括号不匹配');
        output.push(token);
    }

    return output;
}

// ===== RPN EVALUATOR =====
function evaluateRPN(rpn, variables) {
    const stack = [];

    for (const token of rpn) {
        switch (token.type) {
            case 'NUMBER':
                stack.push(token.value);
                break;

            case 'VARIABLE':
                if (!(token.value in variables)) throw new Error(`未定义变量: ${token.value}`);
                stack.push(variables[token.value]);
                break;

            case 'UNARY_MINUS':
                if (stack.length < 1) throw new Error('表达式错误');
                stack.push(-stack.pop());
                break;

            case 'FUNCTION':
                if (stack.length < 1) throw new Error('函数参数不足');
                stack.push(applyFunction(token.value, stack.pop()));
                break;

            case 'OPERATOR':
                if (stack.length < 2) throw new Error('操作数不足');
                const b = stack.pop(), a = stack.pop();
                stack.push(applyOperator(token.value, a, b));
                break;
        }
    }

    if (stack.length !== 1) throw new Error('表达式错误');
    return stack[0];
}

function applyOperator(op, a, b) {
    switch (op) {
        case '+': return a + b;
        case '-': return a - b;
        case '*': return a * b;
        case '/':
            if (Math.abs(b) < 1e-15) throw new Error('不能除以零');
            return a / b;
        case '^':
            if (a === 0 && b < 0) throw new Error('0的负数次幂无定义');
            return Math.pow(a, b);
        default: throw new Error(`未知操作符: ${op}`);
    }
}

function applyFunction(func, arg) {
    switch (func) {
        case 'sin': return Math.sin(arg);
        case 'cos': return Math.cos(arg);
        case 'tan':
            if (Math.abs(Math.cos(arg)) < 1e-10) throw new Error('tan在此处无定义');
            return Math.tan(arg);
        case 'log':
            if (arg <= 0) throw new Error('log的定义域为正数');
            return Math.log(arg);
        case 'sqrt':
            if (arg < 0) throw new Error('不能对负数开方');
            return Math.sqrt(arg);
        case 'abs': return Math.abs(arg);
        default: throw new Error(`未知函数: ${func}`);
    }
}

// ===== MAIN EVALUATE =====
function evaluate(expression, variables) {
    const allowVariables = variables && Object.keys(variables).length > 0;
    const tokens = tokenize(expression, allowVariables);
    const rpn = shuntingYard(tokens);
    return evaluateRPN(rpn, variables || {});
}

// ===== FORMAT RESULT =====
function formatResult(value) {
    if (!isFinite(value)) return value > 0 ? '∞' : '-∞';
    if (Math.abs(value) < 1e-10 && value !== 0) return value.toExponential(6);
    if (Math.abs(value) >= 1e10) return value.toExponential(6);
    // Round to avoid floating point artifacts
    const rounded = Math.round(value * 1e12) / 1e12;
    if (Math.abs(rounded - value) < 1e-10) value = rounded;
    return parseFloat(value.toPrecision(12)).toString();
}

// ===== DISPLAY HELPER =====
function formatDisplay(expr) {
    return expr
        .replace(/\*/g, '×')
        .replace(/\//g, '÷')
        .replace(/pi/g, 'π');
}

// ===== CALCULATOR STATE =====
let currentExpression = '';
let lastResult = null;
let lastAction = null;
let history = [];

// ===== DOM REFERENCES =====
const expressionEl = document.getElementById('expression');
const resultEl = document.getElementById('result');
const historyList = document.getElementById('historyList');
const graphInput = document.getElementById('graphInput');
const graphCanvas = document.getElementById('graphCanvas');
const graphCoordsEl = document.getElementById('graphCoords');

// ===== CALCULATOR ACTIONS =====
function appendToExpression(text) {
    if (lastAction === 'equals') {
        currentExpression = '';
        lastAction = null;
    }
    currentExpression += text;
    updateDisplay();
    lastAction = 'input';
}

function clearAll() {
    currentExpression = '';
    lastResult = null;
    lastAction = null;
    expressionEl.textContent = '';
    resultEl.textContent = '0';
    resultEl.classList.remove('error');
}

function backspace() {
    if (currentExpression.length > 0) {
        // Handle function names
        const funcs = ['sin(', 'cos(', 'tan(', 'log(', 'sqrt(', 'abs(', 'pi', 'e'];
        for (const f of funcs) {
            if (currentExpression.endsWith(f)) {
                currentExpression = currentExpression.slice(0, -f.length);
                updateDisplay();
                return;
            }
        }
        currentExpression = currentExpression.slice(0, -1);
        updateDisplay();
    }
}

function handleSpecial(action) {
    switch (action) {
        case 'sin': appendToExpression('sin('); break;
        case 'cos': appendToExpression('cos('); break;
        case 'tan': appendToExpression('tan('); break;
        case 'log': appendToExpression('log('); break;
        case 'sqrt': appendToExpression('sqrt('); break;
        case 'abs': appendToExpression('abs('); break;
        case 'inv':
            if (currentExpression) {
                currentExpression = '1/(' + currentExpression + ')';
            } else if (lastResult !== null) {
                currentExpression = '1/' + lastResult;
            }
            updateDisplay();
            break;
        case 'percent':
            appendToExpression('/100');
            break;
        case 'pi': appendToExpression('pi'); break;
        case 'e': appendToExpression('e'); break;
        case 'pow': appendToExpression('^'); break;
        case 'clear': clearAll(); break;
        case 'backspace': backspace(); break;
        case 'equals': calculate(); break;
    }
}

function calculate() {
    if (!currentExpression.trim()) return;

    try {
        const result = evaluate(currentExpression);
        const formatted = formatResult(result);

        // Update display
        expressionEl.textContent = formatDisplay(currentExpression) + ' =';
        resultEl.textContent = formatted;
        resultEl.classList.remove('error');

        // Add to history
        addToHistory(currentExpression, formatted);

        // Prepare for chaining
        lastResult = result;
        lastAction = 'equals';
        currentExpression = '';
    } catch (e) {
        resultEl.textContent = '错误: ' + e.message;
        resultEl.classList.add('error');
        lastAction = 'error';
    }
}

function updateDisplay() {
    expressionEl.textContent = formatDisplay(currentExpression);
    resultEl.classList.remove('error');
    // Live preview
    if (currentExpression.trim()) {
        try {
            const result = evaluate(currentExpression);
            resultEl.textContent = formatResult(result);
        } catch (e) {
            // Keep previous result
        }
    } else {
        resultEl.textContent = lastResult !== null ? formatResult(lastResult) : '0';
    }
}

// ===== HISTORY =====
function addToHistory(expr, result) {
    const item = {
        expression: expr,
        result: result,
        time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    };
    history.unshift(item);
    if (history.length > 100) history.pop();
    saveHistory();
    renderHistory();
}

function saveHistory() {
    try {
        localStorage.setItem('calcHistory', JSON.stringify(history));
    } catch (e) { }
}

function loadHistory() {
    try {
        const saved = localStorage.getItem('calcHistory');
        if (saved) history = JSON.parse(saved);
    } catch (e) { }
    renderHistory();
}

function renderHistory() {
    if (history.length === 0) {
        historyList.innerHTML = '<div class="history-empty">暂无计算记录</div>';
        return;
    }

    historyList.innerHTML = history.map((item, i) => `
        <div class="history-item" data-index="${i}">
            <div class="hist-expr">${formatDisplay(item.expression)}</div>
            <div class="hist-result">= ${item.result}</div>
            <div class="hist-time">${item.time}</div>
        </div>
    `).join('');

    // Click to reuse
    historyList.querySelectorAll('.history-item').forEach(el => {
        el.addEventListener('click', () => {
            const idx = parseInt(el.dataset.index);
            currentExpression = history[idx].expression;
            lastAction = null;
            updateDisplay();
        });
    });
}

function clearHistory() {
    history = [];
    saveHistory();
    renderHistory();
}

// ===== THEME =====
function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    try {
        localStorage.setItem('calcTheme', theme);
    } catch (e) { }
    // Redraw graph with new colors
    if (window.grapher) {
        window.grapher.draw(currentGraphExpr);
    }
}

function loadTheme() {
    try {
        const saved = localStorage.getItem('calcTheme');
        if (saved) {
            document.documentElement.setAttribute('data-theme', saved);
            document.getElementById('themeSelect').value = saved;
        }
    } catch (e) { }
}

// ===== GRAPH CLASSIC (canvas) =====
let currentGraphExpr = 'x^2';

class Grapher {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.xMin = -10;
        this.xMax = 10;
        this.yMin = -10;
        this.yMax = 10;
        this.dragging = false;
        this.lastX = 0;
        this.lastY = 0;
        this.dpr = 1;
        this.expression = '';

        this.setupCanvas();
        this.setupEvents();
    }

    setupCanvas() {
        this.dpr = window.devicePixelRatio || 1;
        const rect = this.canvas.parentElement.getBoundingClientRect();
        this.canvas.width = rect.width * this.dpr;
        this.canvas.height = rect.height * this.dpr;
        this.ctx.scale(this.dpr, this.dpr);
    }

    setupEvents() {
        // Wheel zoom
        this.canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            const rect = this.canvas.getBoundingClientRect();
            const mx = e.clientX - rect.left;
            const my = e.clientY - rect.top;
            const mathX = this.xMin + (mx / rect.width) * (this.xMax - this.xMin);
            const mathY = this.yMax - (my / rect.height) * (this.yMax - this.yMin);

            const factor = e.deltaY > 0 ? 1.15 : 0.87;

            this.xMin = mathX - (mathX - this.xMin) * factor;
            this.xMax = mathX + (this.xMax - mathX) * factor;
            this.yMin = mathY - (mathY - this.yMin) * factor;
            this.yMax = mathY + (this.yMax - mathY) * factor;

            this.draw();
        }, { passive: false });

        // Drag pan
        this.canvas.addEventListener('mousedown', (e) => {
            this.dragging = true;
            this.lastX = e.clientX;
            this.lastY = e.clientY;
            this.canvas.style.cursor = 'grabbing';
        });

        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const mathX = this.xMin + ((e.clientX - rect.left) / rect.width) * (this.xMax - this.xMin);
            const mathY = this.yMax - ((e.clientY - rect.top) / rect.height) * (this.yMax - this.yMin);
            graphCoordsEl.textContent = `(${mathX.toFixed(2)}, ${mathY.toFixed(2)})`;

            if (this.dragging) {
                const dx = e.clientX - this.lastX;
                const dy = e.clientY - this.lastY;
                const xRange = this.xMax - this.xMin;
                const yRange = this.yMax - this.yMin;

                this.xMin -= (dx / rect.width) * xRange;
                this.xMax -= (dx / rect.width) * xRange;
                this.yMin += (dy / rect.height) * yRange;
                this.yMax += (dy / rect.height) * yRange;

                this.lastX = e.clientX;
                this.lastY = e.clientY;

                this.draw();
            }
        });

        const endDrag = () => {
            this.dragging = false;
            this.canvas.style.cursor = 'crosshair';
        };
        this.canvas.addEventListener('mouseup', endDrag);
        this.canvas.addEventListener('mouseleave', endDrag);

        // Resize
        window.addEventListener('resize', () => {
            this.setupCanvas();
            this.draw();
        });
    }

    getCSSVar(name) {
        return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    }

    draw(expr) {
        if (expr) this.expression = expr;

        const ctx = this.ctx;
        const rect = this.canvas.parentElement.getBoundingClientRect();
        const w = rect.width;
        const h = rect.height;

        ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);

        // Background
        ctx.fillStyle = this.getCSSVar('--bg-secondary') || '#ffffff';
        ctx.fillRect(0, 0, w, h);

        // Grid
        this.drawGrid(ctx, w, h);

        // Axes
        this.drawAxes(ctx, w, h);

        // Function curve
        if (this.expression) {
            this.drawFunction(ctx, w, h);
        }
    }

    drawGrid(ctx, w, h) {
        const xRange = this.xMax - this.xMin;
        const yRange = this.yMax - this.yMin;
        const xStep = this.calcStep(xRange);
        const yStep = this.calcStep(yRange);

        ctx.strokeStyle = this.getCSSVar('--border') || '#ddd';
        ctx.lineWidth = 0.5;

        for (let x = Math.ceil(this.xMin / xStep) * xStep; x <= this.xMax + xStep / 2; x += xStep) {
            const sx = ((x - this.xMin) / xRange) * w;
            ctx.beginPath();
            ctx.moveTo(sx, 0);
            ctx.lineTo(sx, h);
            ctx.stroke();
        }

        for (let y = Math.ceil(this.yMin / yStep) * yStep; y <= this.yMax + yStep / 2; y += yStep) {
            const sy = ((this.yMax - y) / yRange) * h;
            ctx.beginPath();
            ctx.moveTo(0, sy);
            ctx.lineTo(w, sy);
            ctx.stroke();
        }
    }

    drawAxes(ctx, w, h) {
        const xRange = this.xMax - this.xMin;
        const yRange = this.yMax - this.yMin;
        const textColor = this.getCSSVar('--text-secondary') || '#666';

        ctx.strokeStyle = textColor;
        ctx.lineWidth = 1.5;

        // X axis
        if (this.yMin <= 0 && this.yMax >= 0) {
            const sy = (this.yMax / yRange) * h;
            ctx.beginPath();
            ctx.moveTo(0, sy);
            ctx.lineTo(w, sy);
            ctx.stroke();
        }

        // Y axis
        if (this.xMin <= 0 && this.xMax >= 0) {
            const sx = (-this.xMin / xRange) * w;
            ctx.beginPath();
            ctx.moveTo(sx, 0);
            ctx.lineTo(sx, h);
            ctx.stroke();
        }

        // Labels
        ctx.fillStyle = textColor;
        ctx.font = '10px ' + (this.getCSSVar('--font-mono') || 'monospace');

        const xStep = this.calcStep(xRange);
        const yStep = this.calcStep(yRange);

        for (let x = Math.ceil(this.xMin / xStep) * xStep; x <= this.xMax + xStep / 2; x += xStep) {
            if (Math.abs(x) < xStep * 0.1) continue;
            const sx = ((x - this.xMin) / xRange) * w;
            const labelY = Math.min(Math.max((this.yMax / yRange) * h + 14, 14), h - 4);
            ctx.fillText(this.fmtNum(x), sx - 8, labelY);
        }

        for (let y = Math.ceil(this.yMin / yStep) * yStep; y <= this.yMax + yStep / 2; y += yStep) {
            if (Math.abs(y) < yStep * 0.1) continue;
            const sy = ((this.yMax - y) / yRange) * h;
            ctx.fillText(this.fmtNum(y), 4, sy + 3);
        }
    }

    drawFunction(ctx, w, h) {
        const accent = this.getCSSVar('--accent') || '#007bff';
        ctx.strokeStyle = accent;
        ctx.lineWidth = 2;
        ctx.beginPath();

        let started = false;
        let prevY = null;
        const xRange = this.xMax - this.xMin;
        const yRange = this.yMax - this.yMin;

        for (let px = 0; px <= w; px++) {
            const x = this.xMin + (px / w) * xRange;

            try {
                const y = evaluate(this.expression, { x: x });

                if (!isFinite(y) || isNaN(y)) {
                    started = false;
                    prevY = null;
                    continue;
                }

                // Detect discontinuity
                if (prevY !== null && Math.abs(y - prevY) > yRange * 0.5) {
                    started = false;
                }

                const sy = ((this.yMax - y) / yRange) * h;

                if (sy < -50 || sy > h + 50) {
                    started = false;
                    prevY = y;
                    continue;
                }

                if (!started) {
                    ctx.moveTo(px, sy);
                    started = true;
                } else {
                    ctx.lineTo(px, sy);
                }

                prevY = y;
            } catch (e) {
                started = false;
                prevY = null;
            }
        }

        ctx.stroke();
    }

    calcStep(range) {
        const target = range / 10;
        const mag = Math.pow(10, Math.floor(Math.log10(target)));
        const res = target / mag;
        if (res < 1.5) return mag;
        if (res < 3) return mag * 2;
        if (res < 7) return mag * 5;
        return mag * 10;
    }

    fmtNum(n) {
        if (Math.abs(n) >= 1000 || (Math.abs(n) < 0.01 && n !== 0)) {
            return n.toExponential(0);
        }
        return parseFloat(n.toPrecision(4)).toString();
    }

    reset() {
        this.xMin = -10;
        this.xMax = 10;
        this.yMin = -10;
        this.yMax = 10;
        this.draw();
    }
}

// ===== EVENT BINDINGS =====
function init() {
    // Keypad buttons
    document.querySelectorAll('.keypad .btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const action = btn.dataset.action;
            if (action) {
                if ('0123456789.+-*/^()'.includes(action)) {
                    appendToExpression(action);
                } else {
                    handleSpecial(action);
                }
            }
        });
    });

    // Theme select
    document.getElementById('themeSelect').addEventListener('change', (e) => {
        setTheme(e.target.value);
    });

    // Clear history
    document.getElementById('clearHistoryBtn').addEventListener('click', clearHistory);

    // Graph controls
    document.getElementById('plotBtn').addEventListener('click', () => {
        let expr = graphInput.value.trim();
        // Strip "y = " prefix if present
        expr = expr.replace(/^y\s*=\s*/i, '');
        if (!expr) return;
        currentGraphExpr = expr;
        window.grapher.draw(expr);
    });

    document.getElementById('resetGraphBtn').addEventListener('click', () => {
        window.grapher.reset();
    });

    // Preset buttons
    document.querySelectorAll('.preset-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            graphInput.value = btn.dataset.func;
            currentGraphExpr = btn.dataset.func;
            window.grapher.draw(btn.dataset.func);
        });
    });

    // Keyboard support
    document.addEventListener('keydown', (e) => {
        const key = e.key;

        // Don't capture when typing in graph input
        if (document.activeElement === graphInput) return;

        if (/^[0-9.+\-*/^()=]$/.test(key) || key === 'Enter' || key === 'Backspace' || key === 'Escape' || key === 'Delete') {
            e.preventDefault();
        }

        switch (key) {
            case '0': case '1': case '2': case '3': case '4':
            case '5': case '6': case '7': case '8': case '9':
                appendToExpression(key);
                break;
            case '.':
                appendToExpression('.');
                break;
            case '+':
                appendToExpression('+');
                break;
            case '-':
                appendToExpression('-');
                break;
            case '*':
                appendToExpression('*');
                break;
            case '/':
                appendToExpression('/');
                break;
            case '^':
                appendToExpression('^');
                break;
            case '(':
                appendToExpression('(');
                break;
            case ')':
                appendToExpression(')');
                break;
            case 'Enter':
            case '=':
                calculate();
                break;
            case 'Backspace':
            case 'Delete':
                backspace();
                break;
            case 'Escape':
                clearAll();
                break;
        }
    });

    // Initialize grapher
    window.grapher = new Grapher(graphCanvas);
    window.grapher.draw('x^2');

    // Load saved data
    loadTheme();
    loadHistory();
}

// ===== START =====
document.addEventListener('DOMContentLoaded', init);
