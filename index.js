const priority2UseList = [
    ImmediatePriority,
    UserBlockingPriority,
    NormalPriority,
    LowPriority
];

const priority2Name = [
    "noop",
    "ImmediatePriority",
    "UserBlockingPriority",
    "NormalPriority",
    "LowPriority"
];

const root = document.querySelector("#root");
const contentBox = document.querySelector("#content");

const workList = [];
let prevPriority = IdlePriority;
let curCallback;

// 初始化优先级对应按钮
priority2UseList.forEach((priority) => {
    const btn = document.createElement("button");
    root.appendChild(btn);
    btn.innerText = priority2Name[priority];

    btn.onclick = () => {
        // 插入工作
        workList.push({
            priority,
            count: 100
        });
        ensureRootIsScheduled();
    };
});

/**
 * 调度的逻辑
 */
function ensureRootIsScheduled() {
    // 取出最高优先级的工作
    const curWork = workList.sort((w1, w2) => {
        return w1.priority - w2.priority;
    })[0];

    if (!curWork) {
        // 没有工作需要执行，退出调度
        curCallback = null;
        return;
    }

    const { priority: curPriority } = curWork;

    if (curPriority === prevPriority) {
        // 有工作在进行，比较该工作与正在进行的工作的优先级
        // 如果优先级相同，则不需要调度新的，退出调度
        return;
    }

    // 调度当前最高优先级的工作
    curCallback = scheduleWork(curPriority, perform.bind(null, curWork));
}

// 执行具体的工作
function perform(work, didTimeout) {
    // 是否需要同步执行，满足1.工作是同步优先级 2.当前调度的任务过期了，需要同步执行
    const needSync = work.priority === ImmediatePriority || didTimeout;
    console.log(shouldYield());
    while ((needSync || !shouldYield()) && work.count) {
        work.count--;
        // 执行具体的工作
        insertItem(work.priority + "");
    }
    prevPriority = work.priority;

    if (!work.count) {
        // 完成的work，从workList中删除
        const workIndex = workList.indexOf(work);
        workList.splice(workIndex, 1);
        // 重置优先级
        prevPriority = IdlePriority;
    }

    const prevCallback = curCallback;
    // 调度完后，如果callback变化，代表这是新的work
    ensureRootIsScheduled();
    const newCallback = curCallback;
    if (newCallback && prevCallback === newCallback) {
        // callback没变，代表是同一个work，只不过时间切片时间用尽（5ms）
        // 返回的函数会被Scheduler继续调用
        return perform.bind(null, work);
    }
}

const insertItem = (content) => {
    const ele = document.createElement("span");
    ele.innerText = `${content}`;
    ele.className = `pri-${content}`;
    doSomeBuzyWork(10000000);
    contentBox.appendChild(ele);
};

const doSomeBuzyWork = (len) => {
    let result = 0;
    while (len--) {
        result += len;
    }
};
