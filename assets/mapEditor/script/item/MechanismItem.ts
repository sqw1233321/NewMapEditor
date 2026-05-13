import MapDrawUnitBase from "./MapDrawUnitBase";
import { MechanismInstance } from "../type/MechanismDefine";
import { MechanismMgr } from "../frameWork/MechanismMgr";
import { UnitType } from "../type/mapTypes";

const { ccclass, property } = cc._decorator;

/**
 * 机制项基类
 * 所有动态机制实例的基类，提供统一的字段存取接口
 */
@ccclass
export default class MechanismItem extends MapDrawUnitBase {
    /** 机制定义ID */
    protected _mechanismId: string = "";
    /** 机制实例ID */
    protected _instanceId: string = "";
    /** 字段值映射 */
    protected _fieldValues: Record<string, any> = {};

    public onLoad(): void {
        super.onLoad();
    }

    public onDestroy(): void {
        // 注销实例
        if (this._instanceId) {
            MechanismMgr.instance.unregisterInstance(this._instanceId);
        }
    }

    /** 获取机制ID */
    public getMechanismId(): string {
        return this._mechanismId;
    }

    /** 获取实例ID */
    public getInstanceId(): string {
        return this._instanceId;
    }

    /**
     * 初始化机制实例
     * @param mechanismId 机制定义ID
     * @param instanceId 实例ID
     * @param fieldValues 字段值
     */
    public initMechanism(mechanismId: string, instanceId: string, fieldValues: Record<string, any>): void {
        this._mechanismId = mechanismId;
        this._instanceId = instanceId;
        this._fieldValues = fieldValues ? { ...fieldValues } : {};

        // 注册到管理器
        MechanismMgr.instance.registerInstance(instanceId, this);

        // 更新显示
        this.updateDisplay();
    }

    /**
     * 初始化（兼容 MapDrawUnitBase 接口）
     */
    public init(...params): void {
        if (params.length >= 3) {
            this.initMechanism(params[0], params[1], params[2]);
        }
    }

    /** 获取字段值 */
    public getFieldValue(fieldId: string): any {
        return this._fieldValues[fieldId];
    }

    /** 设置字段值 */
    public setFieldValue(fieldId: string, value: any): void {
        this._fieldValues[fieldId] = value;
        this.updateDisplay();
    }

    /** 获取所有字段值 */
    public getAllFieldValues(): Record<string, any> {
        return { ...this._fieldValues };
    }

    /**
     * 更新显示（子类可重写）
     */
    protected updateDisplay(): void {
        // 子类实现
    }

    /** 获取类型 */
    public getType(): UnitType {
        return UnitType.Mechanism;
    }

    /** 获取机制类型名称 */
    public getMechanismTypeName(): string {
        const def = MechanismMgr.instance.getDefine(this._mechanismId);
        return def ? def.name : this._mechanismId;
    }

    /** 获取数据 */
    public getDat(): MechanismInstance {
        return {
            mechanismId: this._mechanismId,
            instanceId: this._instanceId,
            roomId: this._roomCfgId,
            pos: this.getPos(),
            fieldValues: { ...this._fieldValues },
        };
    }

    /**
     * 从数据恢复
     * @param dat 机制实例数据
     */
    public fromDat(dat: MechanismInstance): void {
        this._mechanismId = dat.mechanismId;
        this._instanceId = dat.instanceId;
        this._fieldValues = dat.fieldValues ? { ...dat.fieldValues } : {};
        this._roomCfgId = dat.roomId;

        // 注册到管理器
        MechanismMgr.instance.registerInstance(this._instanceId, this);

        // 更新显示
        this.updateDisplay();
    }
}
