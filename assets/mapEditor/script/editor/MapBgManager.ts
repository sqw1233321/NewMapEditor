declare global {
    interface Window {
        electronAPI: {
            writeFile: (fileName: string, content: string) => Promise<any>;
            openFileDialog: (filters?, properties?) => Promise<any>;
            //相对路径，绝对路径
            copyFile: (sourcePath: string, destPath: string) => Promise<any>;
            //相对路径的文件夹，目标绝对路径
            copyFiles: (sourcePath: string, destPath: string) => Promise<any>;
            createFile: (fileName: string, jsonContent: string) => Promise<any>;
            readFile: (filePath: string) => Promise<any>;
            readFolder: (folderPath: string) => Promise<any>;
            loadSingleSprite: (relativePath) => Promise<{ success: boolean; error?; data?: string }>;
            selectAtlasFolder: () => Promise<{ success: boolean; path?: string }>;
            saveEditorMapJson: (jsonContent: string) => Promise<{ success: boolean; path?: string; error?: string }>;
            readEditorMapJson: () => Promise<{ success: boolean; content?: string; error?: string }>;
            loadAreaImages: (areaName: string) => Promise<{ success: boolean; images?: { name: string; data: string[] }[][]; error?: string }>;
            //相对路径
            excelToJson: (excelPath, jsonPath) => Promise<any>;
            //相对路径
            jsonToExcel: (jsonPath, excelPath) => Promise<any>;
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

    /** 区域列表 */
    private _areas: AtlasArea[] = [];

    /** SpriteFrame 缓存，key = area name */
    private _spriteCache: Map<string, cc.SpriteFrame[][]> = new Map();

    public static get instance(): MapBgManager {
        if (!this._instance) {
            this._instance = new MapBgManager();
        }
        return this._instance;
    }

    // ==================== 公开接口 ====================

    /** 获取当前地图数据信息 */
    public get currentMapDta(): string {
        return this._currentMapDta;
    }

    /** 获取区域列表 */
    public get areas(): AtlasArea[] {
        return this._areas;
    }

    //根据地图名获取当前的图集配置
    public getMapEditorDat(maoFileName: string): EditorMapEntry {
        return this._mapData.find(e => e.mapDta === maoFileName);
    }

    // ==================== 加载配置 ====================

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


    //===========================     获取区域信息  =================================

    /**
       * 根据 mapDta 加载对应的背景图数据
       */
    public async loadBgByMapDta(mapDta: string): Promise<MapBgInitData | null> {
        this._currentMapDta = mapDta;
        const entry = this._mapData.find(e => e.mapDta === mapDta);
        if (!entry) {
            return null;
        }
        const fileName = entry.mapBg;
        return this.getAreaBgData(fileName);
    }

    /**
     * 获取区域图片数据，用于 MapBgPrefab.init
     * @param fileName levelBg文件名
     */
    public async getAreaBgData(fileName: string): Promise<MapBgInitData | null> {
        if (!fileName) {
            return null;
        }

        // 预加载所有区域图片
        let allSprites: cc.SpriteFrame[][] = [];
        allSprites = await this.preloadArea(fileName);

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
     * 预加载某个区域的图片（通过 IPC 从主进程读取）
     * @param fileName
     */
    public preloadArea(fileName: string): Promise<cc.SpriteFrame[][]> {
        return new Promise((resolve) => {
            if (this._spriteCache.has(fileName)) {
                resolve(this._spriteCache.get(fileName)!);
                return;
            }

            window.electronAPI.loadAreaImages(fileName).then(async (result) => {
                if (!result.success || !result.images || result.images.length === 0) {
                    console.warn(`[MapBgManager] 加载区域 "${fileName}" 失败:`, result.error);
                    this._spriteCache.set(fileName, []);
                    resolve([]);
                    return;
                }

                const sprites = await this.createSpriteFramesFromBase64(result.images);
                this._spriteCache.set(fileName, sprites);
                console.log(`[MapBgManager] 区域 "${fileName}" 加载完成，共 ${sprites.length} 张图片`);
                resolve(sprites);
            });
        });
    }

    /**
     * 将 base64 图片数据转换为 SpriteFrame
     */
    private createSpriteFramesFromBase64(imageAreaInfos: { name: string; data: string[] }[][]): Promise<cc.SpriteFrame[][]> {
        return new Promise((resolve) => {
            const frames: cc.SpriteFrame[][] = [];
            //一共需要加载的图片个数
            let total = 0;
            imageAreaInfos.forEach(imageInfos => {
                imageInfos.forEach(imageInfo => {
                    const srcData = imageInfo.data;
                    total += srcData?.length ?? 0;
                })
            })
            if (total === 0) {
                resolve([]);
                return;
            }
            let tempCount = 0;
            for (const imageInfos of imageAreaInfos) {
                for (const imageInfo of imageInfos) {
                    const tempSpArr = []
                    for (const srcData of imageInfo.data) {
                        const texture = new cc.Texture2D();
                        const img = new Image();
                        img.onload = () => {
                            texture.initWithElement(img);
                            const frame = new cc.SpriteFrame();
                            frame.setTexture(texture);
                            frame.name = imageInfo.name.replace(/\.(jpg|jpeg|png)$/i, '');
                            tempSpArr.push(frame);
                            tempCount++;
                            if (tempCount >= total) {
                                resolve(frames);
                            }
                        };
                        img.onerror = () => {
                            console.warn(`[MapBgManager] 图片加载失败: ${imageInfo.name}`);
                            resolve(frames);
                        };
                        img.src = srcData;
                    }
                    frames.push(tempSpArr);
                }
            }
        });
    }


    //===========================     写入区域信息  ================================

    /**
     * 保存新的图集数据
     * @param mapDta 当前地图数据名称
     */
    public async selectAndImportAtlas(): Promise<string> {
        // 1. 打开文件夹选择框
        const selectResult = await window.electronAPI.selectAtlasFolder();
        if (!selectResult.success) {
            console.log("[MapBgManager] 用户取消了文件夹选择");
            return "";
        }
        // 更新 editorMap.json
        console.log("选择的图集文件名为 ", selectResult.path);
        return selectResult.path;
    }

    /** 更新 editorMap.json 中的某条记录 */
    public updateMapDataEntry(mapEntryDta: EditorMapEntry) {
        let entry = this._mapData.find(e => e.mapDta === mapEntryDta.mapDta);
        if (entry) {
            entry.mapBg = mapEntryDta.mapBg;
            entry.areaNumber = mapEntryDta.areaNumber;
            entry.areaOffset = mapEntryDta.areaOffset;
            entry.areaSize = mapEntryDta.areaSize;
        } else {
            this._mapData.push({
                mapDta: mapEntryDta.mapDta,
                mapBg: mapEntryDta.mapBg,
                areaNumber: mapEntryDta.areaNumber,
                areaOffset: mapEntryDta.areaOffset,
                areaSize: mapEntryDta.areaSize,
            });
        }
        this.saveMapData();
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
}
