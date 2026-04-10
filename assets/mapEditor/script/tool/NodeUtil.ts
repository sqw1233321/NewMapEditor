export class NodeUtil {

    static autoRefreshChildrenNum(parentNd: cc.Node, num: number, cb: (nd: cc.Node, index: number, dat: number) => void) {
        const dat = new Array(num).fill(0);
        NodeUtil.autoRefreshChildren(parentNd, dat, cb);
    }

    static autoRefreshChildren<T>(parentNd: cc.Node, data: T[], cb: (nd: cc.Node, index: number, dat: T) => void) {
        const children = parentNd.children;
        if (children.length === 0) return;
        children.forEach((child) => {
            child.active = false;
        })
        const template = children[0];
        data.forEach((item, index) => {
            const child = children[index];
            if (child) return;
            const nd = cc.instantiate(template);
            nd.parent = parentNd;
        });
        data.forEach((dat, index) => {
            const nd = children[index];
            nd.active = true;
            cb?.(nd, index, dat);
        });
    }
}
