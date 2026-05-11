import MapBgPrefab from "./MapBgPrefab";

declare global {
    interface Window {
        electronAPI: {
            writeFile: (fileName: string, content: string) => Promise<any>;
            openFileDialog: () => Promise<any>;
            createFile: (fileName: string, jsonContent: string) => Promise<any>;
            selectAtlasFolder: () => Promise<{ success: boolean; path?: string }>;
            readAtlasSubfolders: (parentPath: string) => Promise<{ success: boolean; subfolders?: string[]; error?: string }>;
            importAtlasToResources: (sourceFolder: string) => Promise<{ success: boolean; areas?: { name: string; imageCount: number }[]; error?: string }>;
            saveEditorMapJson: (jsonContent: string) => Promise<{ success: boolean; path?: string; error?: string }>;
            readEditorMapJson: () => Promise<{ success: boolean; content?: string; error?: string }>;
            loadAreaImages: (areaName: string) => Promise<{ success: boolean; images?: { name: string; data: string }[]; error?: string }>;
        };
    }
}

export interface AtlasArea {
    name: string;
    imageCount: number;
}

export interface EditorMapEntry {
    mapDta: string;
    mapBg: string;
    areaNumber: number;
    areaOffset: number;
    areaSize: string; // "width|height"
}

export interface MapBgInitData {
    areaNumber: number;
    oneAreaSize: cc.Vec2;
    areaOffset: number;
    sps: cc.SpriteFrame[][];
}

export class MapBgManager {
    private static _instance: MapBgManager = null;

    /** editorMap.json 数据 */
    private _mapData: EditorMapEntry[] = [];

    /** 当前地图数据名称 */
    private _currentMapDta: string = "";

    /** 图集根目录路径 */
    private _atlasRootPath: string = "";

    /** 区域列表 */
    private _areas: AtlasArea[] = [];

    /** SpriteFrame 缓存，key = area name */
    private _spriteCache: Map<string, cc.SpriteFrame[]> = new Map();

    public static get instance(): MapBgManager {
        if (!this._instance) {
            this._instance = new MapBgManager();
        }
        return this._instance;
    }

    // ==================== 公开接口 ====================

    /** 获取当前地图数据名称 */
    public get currentMapDta(): string {
        return this._currentMapDta;
    }

    /** 获取区域列表 */
    public get areas(): AtlasArea[] {
        return this._areas;
    }

    /** 加载 editorMap.json */
    public loadMapData(): Promise<void> {
        return new Promise((resolve) => {
            window.electronAPI.readEditorMapJson().then((result: any) => {
                if (!result.success) {
                    console.warn("[MapBgManager] editorMap.json 加载失败:", result.error);
                    this._mapData = [];
                    resolve();
                    return;
                }
                try {
                    this._mapData = JSON.parse(result.content);
                    console.log("[MapBgManager] editorMap.json 加载完成:", this._mapData);
                } catch (e) {
                    console.error("[MapBgManager] editorMap.json 解析失败:", e);
                    this._mapData = [];
                }
                resolve();
            });
        });
    }

    /** 保存 editorMap.json */
    public async saveMapData(): Promise<boolean> {
        const content = JSON.stringify(this._mapData, null, 4);
        const result = await window.electronAPI.saveEditorMapJson(content);
        if (result.success) {
            console.log("[MapBgManager] editorMap.json 保存成功:", result.path);
        } else {
            console.error("[MapBgManager] editorMap.json 保存失败:", result.error);
        }
        return result.success;
    }

    /**
     * 选择图集文件夹并导入到 resources
     * @param mapDta 当前地图数据名称
     */
    public async selectAndImportAtlas(mapDta: string): Promise<boolean> {
        // 1. 打开文件夹选择框
        const selectResult = await window.electronAPI.selectAtlasFolder();
        if (!selectResult.success) {
            console.log("[MapBgManager] 用户取消了文件夹选择");
            return false;
        }

        this._atlasRootPath = selectResult.path;
        console.log("[MapBgManager] 选择的图集路径:", this._atlasRootPath);

        // 2. 复制到 resources 目录
        const importResult = await window.electronAPI.importAtlasToResources(this._atlasRootPath);
        if (!importResult.success) {
            console.error("[MapBgManager] 图集导入失败:", importResult.error);
            return false;
        }

        this._areas = importResult.areas!;
        console.log("[MapBgManager] 导入的区域列表:", this._areas);

        // 3. 更新 editorMap.json
        this._currentMapDta = mapDta;
        this.updateMapDataEntry(mapDta, this._areas.map(a => a.name));

        return true;
    }

    /**
     * 预加载某个区域的图片（通过 IPC 从主进程读取）
     * @param areaName 区域名称（子文件夹名）
     */
    public preloadArea(areaName: string): Promise<cc.SpriteFrame[]> {
        return new Promise((resolve) => {
            if (this._spriteCache.has(areaName)) {
                resolve(this._spriteCache.get(areaName)!);
                return;
            }

            window.electronAPI.loadAreaImages(areaName).then(async (result) => {
                if (!result.success || !result.images || result.images.length === 0) {
                    console.warn(`[MapBgManager] 加载区域 "${areaName}" 失败:`, result.error);
                    this._spriteCache.set(areaName, []);
                    resolve([]);
                    return;
                }

                // 将 base64 图片转为 SpriteFrame
                const sprites = await this.createSpriteFramesFromBase64(result.images);
                sprites.sort((a, b) => (a.name > b.name ? 1 : -1));
                this._spriteCache.set(areaName, sprites);
                console.log(`[MapBgManager] 区域 "${areaName}" 加载完成，共 ${sprites.length} 张图片`);
                resolve(sprites);
            });
        });
    }

    /**
     * 将 base64 图片数据转换为 SpriteFrame
     */
    private createSpriteFramesFromBase64(images: { name: string; data: string }[]): Promise<cc.SpriteFrame[]> {
        return new Promise((resolve) => {
            const frames: cc.SpriteFrame[] = [];

            let loadedCount = 0;
            const total = images.length;

            if (total === 0) {
                resolve([]);
                return;
            }

            for (const imgData of images) {
                const texture = new cc.Texture2D();
                const img = new Image();

                img.onload = () => {
                    texture.initWithElement(img);
                    const frame = new cc.SpriteFrame();
                    frame.setTexture(texture);
                    frame.name = imgData.name.replace(/\.(jpg|jpeg|png)$/i, '');
                    frames.push(frame);

                    loadedCount++;
                    if (loadedCount === total) {
                        resolve(frames);
                    }
                };

                img.onerror = () => {
                    console.warn(`[MapBgManager] 图片加载失败: ${imgData.name}`);
                    loadedCount++;
                    if (loadedCount === total) {
                        resolve(frames);
                    }
                };

                img.src = imgData.data;
            }
        });
    }

    /**
     * 获取区域图片数据，用于 MapBgPrefab.init
     * @param areaNames 区域名称数组
     */
    public async getAreaBgData(areaNames: string[]): Promise<MapBgInitData | null> {
        if (!areaNames || areaNames.length === 0) {
            return null;
        }

        // 预加载所有区域图片
        const allSprites: cc.SpriteFrame[][] = [];
        for (const name of areaNames) {
            const sprites = await this.preloadArea(name);
            if (sprites.length > 0) {
                allSprites.push(sprites);
            }
        }

        if (allSprites.length === 0) {
            return null;
        }

        // 从 JSON 读取尺寸和偏移
        const entry = this._mapData.find(e => e.mapDta === this._currentMapDta);
        if (!entry) {
            return null;
        }

        const sizeParts = entry.areaSize.split("|");
        const areaSize = new cc.Vec2(parseInt(sizeParts[0]), parseInt(sizeParts[1]));

        return {
            areaNumber: entry.areaNumber,
            oneAreaSize: areaSize,
            areaOffset: entry.areaOffset,
            sps: allSprites,
        };
    }

    /**
     * 根据 mapDta 查找对应的 mapBg 区域列表
     */
    public getAreaNamesByMapDta(mapDta: string): string[] {
        const entry = this._mapData.find(e => e.mapDta === mapDta);
        if (!entry) {
            return [];
        }
        return entry.mapBg.split(",").map(s => s.trim());
    }

    /**
     * 根据 mapDta 加载对应的背景图数据
     */
    public async loadBgByMapDta(mapDta: string): Promise<MapBgInitData | null> {
        this._currentMapDta = mapDta;
        const entry = this._mapData.find(e => e.mapDta === mapDta);
        if (!entry) {
            return null;
        }
        const areaNames = entry.mapBg.split(",").map(s => s.trim());
        return this.getAreaBgData(areaNames);
    }

    // ==================== 私有方法 ====================

    /** 更新 editorMap.json 中的某条记录 */
    private updateMapDataEntry(mapDta: string, areaNames: string[]) {
        let entry = this._mapData.find(e => e.mapDta === mapDta);
        if (entry) {
            entry.mapBg = areaNames.join(",");
            entry.areaNumber = areaNames.length;
            // areaOffset 和 areaSize 暂时写默认值，后续可以手动编辑 JSON
            entry.areaOffset = 4000;
            entry.areaSize = "2906|3654";
        } else {
            this._mapData.push({
                mapDta,
                mapBg: areaNames.join(","),
                areaNumber: areaNames.length,
                areaOffset: 4000,
                areaSize: "2906|3654",
            });
        }
        this.saveMapData();
    }
}
