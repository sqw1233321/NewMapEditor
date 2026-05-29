const { ccclass, property, executeInEditMode } = cc._decorator;

@ccclass
@executeInEditMode
export default class CustomWidget extends cc.Component {

    @property(cc.Node)
    target: cc.Node = null;

    @property
    isAlignLeft: boolean = true;

    @property
    isAlignRight: boolean = false;

    @property
    isAlignTop: boolean = false;

    @property
    isAlignBottom: boolean = true;

    @property
    isAlignHorizontalCenter: boolean = false;

    @property
    isAlignVerticalCenter: boolean = false;

    @property
    left: number = 0;

    @property
    right: number = 0;

    @property
    top: number = 0;

    @property
    bottom: number = 0;

    @property
    horizontalCenter: number = 0;

    @property
    verticalCenter: number = 0;

    private _targetSizeListener: any = null;

    protected onLoad(): void {
        if (this.target) {
            this.addTargetListener();
        }
        this.apply();
    }

    protected onEnable(): void {
        this.apply();
    }

    protected onDisable(): void {
        this.removeTargetListener();
    }

    protected onDestroy(): void {
        this.removeTargetListener();
    }

    /**
     * 监听 target 的尺寸变化
     */
    private addTargetListener(): void {
        if (!this.target) return;

        // 监听 contentSize 变化
        this._targetSizeListener = () => {
            this.apply();
        };
        this.target.on(cc.Node.EventType.SIZE_CHANGED, this._targetSizeListener, this);
        this.target.on(cc.Node.EventType.POSITION_CHANGED, this._targetSizeListener, this);
    }

    /**
     * 移除监听
     */
    private removeTargetListener(): void {
        if (this.target && this._targetSizeListener) {
            this.target.off(cc.Node.EventType.SIZE_CHANGED, this._targetSizeListener, this);
            this.target.off(cc.Node.EventType.POSITION_CHANGED, this._targetSizeListener, this);
        }
    }

    /**
     * 设置 target（动态切换时调用）
     */
    public setTarget(target: cc.Node): void {
        if (this.target === target) return;

        this.removeTargetListener();
        this.target = target;
        if (this.target) {
            this.addTargetListener();
        }
        this.apply();
    }

    /**
     * 应用对齐计算
     */
    public apply(): void {
        if (!this.target || !this.node.parent) return;

        const targetSize = this.target.getContentSize();
        const targetAnchor = this.target.getAnchorPoint();
        const targetPos = this.target.getPosition();
        const targetParent = this.target.parent;

        // 转换 target 世界坐标到当前节点的父节点坐标
        const worldPos = targetParent.convertToWorldSpaceAR(targetPos);
        const localPos = this.node.parent.convertToNodeSpaceAR(worldPos);

        const nodeSize = this.node.getContentSize();
        const nodeAnchor = this.node.getAnchorPoint();

        // 计算 target 在当前父节点的边界（考虑锚点和尺寸）
        const targetLeft = localPos.x - targetSize.width * targetAnchor.x;
        const targetRight = targetLeft + targetSize.width;
        const targetTop = localPos.y + targetSize.height * (1 - targetAnchor.y);
        const targetBottom = localPos.y - targetSize.height * targetAnchor.y;
        const targetCenterX = targetLeft + targetSize.width * targetAnchor.x;
        const targetCenterY = targetBottom + targetSize.height * (1 - targetAnchor.y);

        let finalX = this.node.x;
        let finalY = this.node.y;
        let finalWidth = nodeSize.width;
        let finalHeight = nodeSize.height;

        // 水平方向对齐
        if (this.isAlignHorizontalCenter) {
            finalX = targetCenterX + this.horizontalCenter;
        } else {
            if (this.isAlignLeft) {
                finalX = targetLeft + this.left + nodeSize.width * nodeAnchor.x;
            }
            if (this.isAlignRight) {
                finalX = targetRight - this.right - nodeSize.width * (1 - nodeAnchor.x);
            }
        }

        // 垂直方向对齐
        if (this.isAlignVerticalCenter) {
            finalY = targetCenterY + this.verticalCenter;
        } else {
            if (this.isAlignTop) {
                finalY = targetTop + this.top - nodeSize.height * (1 - nodeAnchor.y);
            }
            if (this.isAlignBottom) {
                finalY = targetBottom + this.bottom + nodeSize.height * nodeAnchor.y;
            }
        }

        // 水平同时有 left 和 right 时，拉伸宽度
        if (this.isAlignLeft && this.isAlignRight) {
            finalWidth = targetSize.width - this.left - this.right;
        }

        // 垂直同时有 top 和 bottom 时，拉伸高度
        if (this.isAlignTop && this.isAlignBottom) {
            finalHeight = targetSize.height - this.top - this.bottom;
        }

        this.node.x = finalX;
        this.node.y = finalY;
        this.node.setContentSize(finalWidth, finalHeight);
    }
}