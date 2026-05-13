import { MechanismMgr, MECHANISM_EVENT } from "./MechanismMgr";
import { MechanismDefine } from "../type/MechanismDefine";
import { EventManager } from "./EventManager";
import { ModeType } from "../type/types";
import { ModeMgr } from "./ModeMgr";
import { MapEditorEvent } from "../event/eventTypes";

const { ccclass, property } = cc._decorator;

/**
 * 机制工具栏
 * 负责动态生成机制选择按钮
 */
@ccclass
export default class MechanismToolbar extends cc.Component {
    /** 工具栏容器节点 */
    @property(cc.Node)
    container: cc.Node = null;

    /** 按钮预制体 */
    @property(cc.Prefab)
    buttonPrefab: cc.Prefab = null;

    /** 图集（用于加载图标） */
    @property(cc.SpriteAtlas)
    iconAtlas: cc.SpriteAtlas = null;

    /** 当前选中的机制ID */
    private _selectedMechanismId: string = null;
    /** 按钮映射 */
    private _buttonMap: Map<string, cc.Node> = new Map();
    /** 工具栏是否可见 */
    private _visible: boolean = true;

    onLoad(): void {
        this.init();
    }

    /**
     * 初始化
     */
    public init(): void {
        // 监听机制定义更新事件
        EventManager.instance.on(
            MECHANISM_EVENT.DefineUpdated,
            this.onDefineUpdated,
            this
        );

        // 监听机制选择事件
        EventManager.instance.on(
            MECHANISM_EVENT.SelectDefine,
            this.onMechanismSelected,
            this
        );

        // 监听工具栏显示切换
        EventManager.instance.on(
            MapEditorEvent.ToggleMechanismToolbar,
            this.onToggleToolbar,
            this
        );

        // 初始化工具栏
        this.refreshToolbar();
    }

    onDestroy(): void {
        EventManager.instance.off(
            MECHANISM_EVENT.DefineUpdated,
            this.onDefineUpdated,
            this
        );

        EventManager.instance.off(
            MECHANISM_EVENT.SelectDefine,
            this.onMechanismSelected,
            this
        );

        EventManager.instance.off(
            MapEditorEvent.ToggleMechanismToolbar,
            this.onToggleToolbar,
            this
        );
    }

    /**
     * 刷新工具栏
     */
    public refreshToolbar(): void {
        if (!this.container) return;

        // 清空现有按钮
        this.container.removeAllChildren();
        this._buttonMap.clear();

        // 获取工具栏定义的机制
        const defines = MechanismMgr.instance.getToolbarDefines();

        defines.forEach((def, index) => {
            const button = this.createToolbarButton(def, index);
            if (button) {
                this.container.addChild(button);
                this._buttonMap.set(def.id, button);
            }
        });

        this.updateButtonStates();
    }

    /**
     * 创建工具栏按钮
     */
    private createToolbarButton(def: MechanismDefine, index: number): cc.Node {
        let button: cc.Node;

        if (this.buttonPrefab) {
            button = cc.instantiate(this.buttonPrefab);
        } else {
            // 使用默认按钮模板
            button = this.createDefaultButton();
        }

        // 设置名称
        button.name = `mechanism_btn_${def.id}`;

        // 查找子节点
        const labelNode = button.getChildByName("Label") || button.getChildByName("label");
        const iconNode = button.getChildByName("Icon") || button.getChildByName("icon");

        // 设置标签文本
        if (labelNode) {
            const label = labelNode.getComponent(cc.Label);
            if (label) {
                label.string = def.name;
            }
        }

        // 设置图标
        if (iconNode && this.iconAtlas) {
            const sprite = iconNode.getComponent(cc.Sprite);
            if (sprite) {
                const frame = this.iconAtlas.getSpriteFrame(def.atlasFrame);
                if (frame) {
                    sprite.spriteFrame = frame;
                }
            }
        }

        // 设置按钮点击事件
        const buttonCom = button.getComponent(cc.Button) || button.addComponent(cc.Button);
        const clickEvent = new cc.Component.EventHandler();
        clickEvent.target = this.node;
        clickEvent.component = "MechanismToolbar";
        clickEvent.handler = "onMechanismButtonClick";
        clickEvent.customEventData = def.id;
        buttonCom.clickEvents.push(clickEvent);

        return button;
    }

    /**
     * 创建默认按钮模板
     */
    private createDefaultButton(): cc.Node {
        const button = new cc.Node("Button");
        button.addComponent(cc.Button);

        // 背景
        const bg = new cc.Node("Background");
        bg.addComponent(cc.Sprite);
        bg.parent = button;

        // 标签
        const label = new cc.Node("Label");
        label.addComponent(cc.Label);
        label.parent = button;
        const labelCom = label.getComponent(cc.Label);
        labelCom.fontSize = 14;
        labelCom.lineHeight = 20;

        return button;
    }

    /**
     * 机制按钮点击
     */
    public onMechanismButtonClick(event: cc.Event, customData: string): void {
        const mechanismId = customData;
        if (!mechanismId) return;

        // 切换选中状态
        if (this._selectedMechanismId === mechanismId) {
            // 取消选择
            this._selectedMechanismId = null;
            MechanismMgr.instance.selectDefine(null);
            //ModeMgr.instance.setMode(ModeType.SelectPoint);
        } else {
            // 选中新机制
            this._selectedMechanismId = mechanismId;
            MechanismMgr.instance.selectDefine(mechanismId);
            this.updateButtonStates();
        }
    }

    /**
     * 机制定义更新回调
     */
    private onDefineUpdated(defines: Map<string, MechanismDefine>): void {
        this.refreshToolbar();
    }

    /**
     * 机制选择回调
     */
    private onMechanismSelected(mechanismId: string): void {
        this._selectedMechanismId = mechanismId;
        this.updateButtonStates();
    }

    /**
     * 切换工具栏显示
     */
    private onToggleToolbar(visible?: boolean): void {
        if (visible !== undefined) {
            this._visible = visible;
        } else {
            this._visible = !this._visible;
        }

        if (this.container) {
            this.container.active = this._visible;
        }
    }

    /**
     * 更新按钮状态
     */
    private updateButtonStates(): void {
        this._buttonMap.forEach((button, id) => {
            const isSelected = id === this._selectedMechanismId;
            this.setButtonSelected(button, isSelected);
        });
    }

    /**
     * 设置按钮选中状态
     */
    private setButtonSelected(button: cc.Node, selected: boolean): void {
        const bg = button.getChildByName("Background");
        if (bg) {
            const sprite = bg.getComponent(cc.Sprite);
            if (sprite) {
                // 选中状态使用高亮颜色
                if (selected) {
                    sprite.node.color = new cc.Color(100, 200, 255);
                } else {
                    sprite.node.color = cc.Color.WHITE;
                }
            }
        }
    }

    /**
     * 获取当前选中的机制ID
     */
    public getSelectedMechanismId(): string {
        return this._selectedMechanismId;
    }

    /**
     * 获取当前选中的机制定义
     */
    public getSelectedMechanismDefine(): MechanismDefine {
        if (!this._selectedMechanismId) return null;
        return MechanismMgr.instance.getDefine(this._selectedMechanismId);
    }

    /**
     * 清除选择
     */
    public clearSelection(): void {
        this._selectedMechanismId = null;
        this.updateButtonStates();
    }

    /**
     * 显示工具栏
     */
    public show(): void {
        this._visible = true;
        if (this.container) {
            this.container.active = true;
        }
    }

    /**
     * 隐藏工具栏
     */
    public hide(): void {
        this._visible = false;
        if (this.container) {
            this.container.active = false;
        }
    }
}
