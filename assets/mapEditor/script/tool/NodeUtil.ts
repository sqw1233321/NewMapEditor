export class NodeUtil {

    static autoRefreshChildrenNum(parentNd: cc.Node, num: number, cb: (nd: cc.Node, index: number, dat: number) => void) {
        const dat = new Array(num).fill(0);
        NodeUtil.autoRefreshChildren(parentNd, dat, cb);
    }

    static autoRefreshChildren<T>(parentNd: cc.Node, data: T[], cb: (nd: cc.Node, index: number, dat: T) => void, defaultNd: cc.Node = null) {
        const children = parentNd.children;
        if (children.length === 0) {
            if (!defaultNd) return;
            const nd = cc.instantiate(defaultNd);
            parentNd.addChild(nd);
            nd.setPosition(cc.Vec3.ZERO);
        }
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

    static deepClone<T>(obj: T): T {
        if (obj === null || typeof obj !== 'object') {
            return obj;
        }
        if (obj instanceof Date) {
            return new Date(obj.getTime()) as any;
        }
        if (obj instanceof Array) {
            const cloneArr: any[] = [];
            obj.forEach((item) => {
                cloneArr.push(this.deepClone(item));
            });
            return cloneArr as any;
        }
        const cloneObj = {} as T;
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                cloneObj[key] = this.deepClone(obj[key]);
            }
        }
        return cloneObj;
    }
}
