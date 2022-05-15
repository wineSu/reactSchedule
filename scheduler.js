const queue = [];
// 每隔 5ms 中断一次
const threshold = 5;
const unit = [];
let deadline = 0;

// 收集 flushWork 并触发一个宏任务
const schedule = (cb) => unit.push(cb) === 1 && postMessage();

// 对外暴露的入口，进行任务收集 time暂时代表为优先级
const scheduleWork = (time, callback) => {
    var timeout;
    switch (time) {
        case 1:
            timeout = -1;
            break;
        case 2:
            timeout = 250;
            break;
        case 3:
            timeout = 500000;
            break;
        case 4:
            timeout = 5000;
            break;
        case 5:
        default:
            timeout = 10000;
            break;
    }
    const job = {
        callback,
        time: timeout + getTime()
    };
    queue.push(job);
    schedule(flushWork);
    return job;
};

// 不兼容 MessageChannel 则使用 setTimeout
const postMessage = (() => {
    const cb = () => unit.splice(0, unit.length).forEach((c) => c());
    if (typeof MessageChannel !== "undefined") {
        const { port1, port2 } = new MessageChannel();
        port1.onmessage = cb;
        return () => port2.postMessage(null);
    }
    return () => setTimeout(cb);
})();

// 这里执行传入的任务
const flush = (initTime) => {
    let currentTime = initTime;
    let job = peek(queue);
    while (job) {
        const timeout = job.time <= currentTime;
        // 超过了 5 ms 立即终止 交还控制权给浏览器一下
        if (!timeout && shouldYield()) break;
        const callback = job.callback;
        job.callback = null;
        // 这里的 next 存在则意味着fiber的中断  下段代码进行相关解释
        const next = callback(timeout);
        if (next) {
            job.callback = next;
        } else {
            queue.shift();
        }
        job = peek(queue);
        currentTime = getTime();
    }
    return !!job;
};

// 还有任务一直递归执行
const flushWork = () => {
    const currentTime = getTime();
    deadline = currentTime + threshold;
    flush(currentTime) && schedule(flushWork);
};

// 是否过期
const shouldYield = () => {
    return getTime() >= deadline;
};

const getTime = () => performance.now();

// 模拟优先级
const peek = (queue) => {
    queue.sort((a, b) => a.time - b.time);
    return queue[0];
};

const ImmediatePriority = 1;
const UserBlockingPriority = 2;
const NormalPriority = 3;
const LowPriority = 4;
const IdlePriority = 5;
