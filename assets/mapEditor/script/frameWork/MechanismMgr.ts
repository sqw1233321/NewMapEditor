import { EventManager } from "./EventManager";
import { MechanismDefine, MechanismFieldDefine, MechanismInstance, MechanismConfig, MechanismFieldType } from "../type/MechanismDefine";
import { Singleton } from "./Singleton";
import MapLoader from "../item/MapLoader";
import { attrPanelTypeMechanism } from "../type/types";
import MechanismItem from "../item/MechanismItem";


/** 机制选择事件 */
export const MECHANISM_EVENT = {
    /** 选中机制定义 */
    SelectDefine: "MechanismSelectDefine",
    /** 机制实例创建 */
    InstanceCreated: "MechanismInstanceCreated",
    /** 机制定义更新 */
    DefineUpdated: "MechanismDefineUpdated",
};

/**
 * 机制管理器
 * 负责管理机制定义的加载、缓存，以及机制实例的创建和管理
 */
export class MechanismMgr extends Singleton<MechanismMgr> {
    /** 机制定义映射 */
    private _defineMap: Map<string, MechanismDefine> = new Map();
    /** 机制实例映射 */
    private _instanceMap: Map<string, MechanismItem> = new Map();
    /** 当前选中的机制定义ID */
    private _selectedDefineId: string = null;
    /** 机制配置 */
    private _config: MechanismConfig = null;

    public static get instance(): MechanismMgr {
        return super.instance as MechanismMgr;
    }

    protected onInit(params: MapLoader): void {
        // 初始化完成
    }

    /** 加载机制配置 */
    public loadConfig(config: MechanismConfig): void {
        this._config = config;
        this._defineMap.clear();

        if (config && config.defines) {
            config.defines.forEach(def => {
                this._defineMap.set(def.id, def);
            });
        }

        EventManager.instance.emit(MECHANISM_EVENT.DefineUpdated, this._defineMap);
    }

    /**
     * 异步加载机制配置（从 resources 路径）
     * @param configPath 配置文件路径（不含扩展名），如 "mapEditor/config/mechanismDefine"
     */
    public loadConfigFromResources(configPath: string): Promise<boolean> {
        return new Promise((resolve) => {
            cc.resources.load(configPath, (err, resource) => {
                if (err) {
                    console.error(`[MechanismMgr] Failed to load config: ${configPath}`, err);
                    resolve(false);
                    return;
                }

                const config = resource?.json as MechanismConfig;
                if (!config || !config.defines) {
                    console.error(`[MechanismMgr] Invalid config format: ${configPath}`);
                    resolve(false);
                    return;
                }

                this.loadConfig(config);
                console.log(`[MechanismMgr] Config loaded: ${config.defines.length} mechanisms`);
                resolve(true);
            });
        });
    }

    /** 获取配置 */
    public getConfig(): MechanismConfig {
        return this._config;
    }

    /** 获取定义 */
    public getDefine(id: string): MechanismDefine {
        return this._defineMap.get(id);
    }

    /** 获取工具栏显示的机制定义 */
    public getToolbarDefines(): MechanismDefine[] {
        return Array.from(this._defineMap.values())
            .filter(def => def.showInToolbar)
            .sort((a, b) => a.toolbarOrder - b.toolbarOrder);
    }

    /** 选中机制定义 */
    public selectDefine(id: string): void {
        this._selectedDefineId = id;
        EventManager.instance.emit(MECHANISM_EVENT.SelectDefine, id);
    }

    /** 获取当前选中的机制定义 */
    public getSelectedDefine(): MechanismDefine {
        return this._selectedDefineId ? this._defineMap.get(this._selectedDefineId) : null;
    }

    /** 注册机制实例 */
    public registerInstance(instanceId: string, item: MechanismItem): void {
        this._instanceMap.set(instanceId, item);
    }

    /** 注销机制实例 */
    public unregisterInstance(instanceId: string): void {
        this._instanceMap.delete(instanceId);
    }

    /** 获取机制实例 */
    public getInstance(instanceId: string): MechanismItem {
        return this._instanceMap.get(instanceId);
    }

    /** 获取所有实例 */
    public getAllInstances(): MechanismItem[] {
        return Array.from(this._instanceMap.values());
    }

    /** 构建属性面板数据 */
    public buildAttrPanelData(item: MechanismItem): attrPanelTypeMechanism {
        const def = this._defineMap.get(item.getMechanismId());
        if (!def) return null;

        const values: Record<string, any> = {};
        def.fields.forEach(field => {
            const value = item.getFieldValue(field.id) ?? field.defaultValue;
            values[field.id] = value;
        });

        return {
            mechanismId: def.id,
            mechanismName: def.name,
            fields: def.fields,
            values: values,
        };
    }

    /** 创建机制实例 */
    public createInstance(mechanismId: string, roomId: number, pos: { x: number; y: number }): MechanismInstance {
        const def = this._defineMap.get(mechanismId);
        if (!def) return null;

        const fieldValues: Record<string, any> = {};
        def.fields.forEach(field => {
            fieldValues[field.id] = field.defaultValue;
        });

        return {
            mechanismId,
            instanceId: `${mechanismId}_${Date.now()}`,
            roomId,
            pos,
            fieldValues,
        };
    }

    /** 更新机制定义 */
    public updateDefine(id: string, newDef: MechanismDefine): void {
        if (this._defineMap.has(id)) {
            this._defineMap.set(id, newDef);
            EventManager.instance.emit(MECHANISM_EVENT.DefineUpdated, this._defineMap);
        }
    }

    /** 添加机制定义 */
    public addDefine(def: MechanismDefine): void {
        this._defineMap.set(def.id, def);
        EventManager.instance.emit(MECHANISM_EVENT.DefineUpdated, this._defineMap);
    }

    /** 删除机制定义 */
    public removeDefine(id: string): void {
        this._defineMap.delete(id);
        EventManager.instance.emit(MECHANISM_EVENT.DefineUpdated, this._defineMap);
    }

    /** 获取所有实例数据 */
    public getAllInstanceData(): MechanismInstance[] {
        const instances: MechanismInstance[] = [];
        this._instanceMap.forEach((item, instanceId) => {
            instances.push(item.getDat());
        });
        return instances;
    }

    /** 清除所有实例 */
    public clearAllInstances(): void {
        this._instanceMap.clear();
    }
}
