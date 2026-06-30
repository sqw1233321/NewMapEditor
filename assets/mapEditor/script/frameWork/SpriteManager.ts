import { MapEditorEvent } from "../event/eventTypes";
import { EventManager } from "./EventManager";
import { Singleton } from "./Singleton";

export default class SpriteManager extends Singleton<SpriteManager> {
    //地图数据map：相对路径，图片
    private _spriteDatMap: Map<string, cc.SpriteFrame> = new Map();
    //spine地图数据map：相对路径，spine数据
    private _spineDatMap: Map<string, sp.SkeletonData> = new Map();

    public static get instance(): SpriteManager {
        return super.instance as SpriteManager;
    }


    //================图片相关==================
    //加载图片
    public async loadSprite(relativePath: string): Promise<cc.SpriteFrame> {
        if (this._spriteDatMap.has(relativePath)) {
            return this._spriteDatMap.get(relativePath);
        }
        let spriteFrame: cc.SpriteFrame;
        if (!CC_BUILD) {
            const resourcePath = relativePath.replace(/\.[^.]+$/, '');
            spriteFrame = await new Promise<cc.SpriteFrame>((resolve, reject) => {
                cc.resources.load(resourcePath, cc.SpriteFrame, null, (err, result) => {
                    if (err) {
                        EventManager.instance.emit(MapEditorEvent.ShowTip, `图片加载失败: ${relativePath}`);
                        resolve(null);
                    } else {
                        resolve(result);
                    }
                });
            });
        } else {
            const result = await window.electronAPI.loadSingleSprite(relativePath);
            if (!result.success) {
                EventManager.instance.emit(MapEditorEvent.ShowTip, `图片加载失败: ${relativePath}`);
            }
            else {
                spriteFrame = await this.createSpriteFromBase64(result.data);
            }
        }
        if (!spriteFrame) return null;
        this._spriteDatMap.set(relativePath, spriteFrame);
        return spriteFrame;
    }

    //将图片从base64转化为cocos资源
    private async createSpriteFromBase64(base64Data: string): Promise<cc.SpriteFrame> {
        return new Promise<cc.SpriteFrame>((resolve, reject) => {
            const texture = new cc.Texture2D();
            const img = new Image();
            img.onload = () => {
                texture.initWithElement(img);
                const frame = new cc.SpriteFrame();
                frame.setTexture(texture);
                resolve(frame);
            };
            img.onerror = (err) => {
                EventManager.instance.emit(MapEditorEvent.ShowTip, `图片加载失败`);
                console.log("图片加载失败 ", err);
                resolve(null);
            };
            img.src = base64Data;
        });
    }

    //==========spine相关==================
    //加载spine
    public async loadSpine(relativePath: string): Promise<sp.SkeletonData> {
        if (this._spineDatMap.has(relativePath)) {
            return this._spineDatMap.get(relativePath);
        }
        let spineData: sp.SkeletonData;
        if (!CC_BUILD) {
            // debug 模式：去掉后缀
            // const arr = relativePath.split("/");
            // const fileName = arr[arr.length - 1];
            // const resourcePath = `${relativePath}/${fileName}`;
            const resourcePath = relativePath;
            spineData = await new Promise<sp.SkeletonData>((resolve, reject) => {
                // 注意：加载的是 sp.SkeletonData，不是 sp.Skeleton
                cc.resources.load(resourcePath, sp.SkeletonData, (err, result) => {
                    if (err) {
                        EventManager.instance.emit(MapEditorEvent.ShowTip, `动画加载失败: ${relativePath}`);
                        resolve(null);
                    } else {
                        resolve(result);
                    }
                });
            });
        } else {
            // build 模式：通过 electronAPI 加载（需要返回 base64 的 SkeletonData）
            const result = await window.electronAPI.loadSingleSpine(relativePath);
            if (!result || !result.success) {
                EventManager.instance.emit(MapEditorEvent.ShowTip, `动画加载失败: ${relativePath}`);
            }
            else {
                //创建动画资源
                const json = result.json;
                const png = result.png;
                const atlas = result.atlas;
                spineData = await this.createSpineData(json, png, atlas);
            }
        }
        if (!spineData) return null;
        this._spineDatMap.set(relativePath, spineData);
        return spineData;
    }

    //创建动画资源：json，png，atlas
    private async createSpineData(json: string, pngBase64: string, atlas: string): Promise<sp.SkeletonData> {
        return new Promise<sp.SkeletonData>((resolve, reject) => {
            // 1. 用 base64 创建 Image 对象
            const image = new Image();
            image.src = pngBase64; // "data:image/png;base64,xxxxx"

            image.onload = () => {
                const texture = new cc.Texture2D();
                texture.initWithElement(image);
                texture.handleLoadedTexture();

                // 从 atlas 第一行拿到纹理名，存入 texture cache
                const lines = atlas.split('\n').filter(l => l.trim().length > 0);
                const textureName = lines[0].trim();
                const skeletonData = new sp.SkeletonData();
                skeletonData.skeletonJson = json;
                skeletonData.atlasText = atlas;
                skeletonData.textures = [texture];
                skeletonData["textureNames"] = [textureName];
                resolve(skeletonData);
            };


            image.onerror = (err) => {
                EventManager.instance.emit(MapEditorEvent.ShowTip, `纹理加载失败`);
                console.log("纹理加载失败 ", err);
                resolve(null);
            };
        });
    }
}
