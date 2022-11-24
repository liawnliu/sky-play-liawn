import { device } from "device";
/** 日志保存路径 */
export const LOG_SAVE_PATH = 'bin/log/log.txt';
/** 数据仓库名 */
export const DATA_STORE_NAME = 'skey-play-liawn';
/** 15个坐标存在仓库中的key */
export const DATA_STORE_POINTS = 'points';
/** "设置"在仓库中的key */
export const DATA_STORE_SETTINGS = 'settings';
/** "播放数据"在仓库中的key */
export const DATA_STORE_PLAY_STATE = 'playState';
/** sky studio形式的音乐数据存储的路径 */
export const MUSIC_DIR_PATH = 'bin/public/music/sky-studio/';
/** 图标宽度 */
export const IMG_WIDTH = 27;
/** 图标高度 */
export const IMG_HEIGHT = 50;
/** 图标显示位置 */
export const IMG_POSITION = { x: 0, y:  (device.screenWidth - IMG_HEIGHT) / 2}
/** 功能选择区的所有功能名称 */
export const SELECT_FUNC_PARAMS = [{ id: '1', name: '开始弹奏' }, { id: '2', name: '设置' }, { id: '3', name: '退出程序' }];
// export const SELECT_FUNC_PARAMS = ['快速开始', '选择歌曲', '设置', '退出'];
/** 功能选择区的宽度 */
export const SELECT_FUNC_WIDTH = 250;
/** 功能选择区的高度 */
export const SELECT_FUNC_HEIGHT = 432; // 144
/** 功能选择区的位置 */
export const SELECT_FUNC_POSITION = { x: 80, y: IMG_POSITION.y - SELECT_FUNC_HEIGHT / 2 + IMG_HEIGHT }
/** 弹奏按钮区的宽度 */
export const START_PLAY_WIDTH = 1300;
/** 弹奏按钮区的高度 */
export const START_PLAY_HEIGHT = 200;
/** 弹奏按钮区的位置 */
export const START_PLAY_POSITION = { x: (device.screenHeight - START_PLAY_WIDTH) / 2, y: (device.screenWidth - START_PLAY_HEIGHT) }
/** 音乐选择区的宽度 */
export const SELECT_MUSIC_WIDTH = 350;
/** 音乐选择区的高度 */
export const SELECT_MUSIC_HEIGHT = device.screenWidth - 100;
/** 音乐选择区的位置 */
export const SELECT_MUSIC_POSITION = { x: (device.screenHeight - START_PLAY_WIDTH) / 2 - SELECT_MUSIC_WIDTH - 10, y: 100 }
/** 选择歌曲 */
export const ICON_MUSIC_LIST = 'file://bin/public/icon/music-list.png';
/** 列表循环 */
export const ICON_LIST_REPEAT = 'file://bin/public/icon/list-repeat.png';
/** 随机循环 */
export const ICON_RANDOM_PLAY = 'file://bin/public/icon/random-play.png';
/** 单曲循环 */
export const ICON_ONE_REPEAT = 'file://bin/public/icon/one-repeat.png';
/** 上一曲 */
export const ICON_BACK = 'file://bin/public/icon/back.png';
/** 待播放按钮 */
export const ICON_PLAY_CIRCLE = 'file://bin/public/icon/play-circle.png';
/** 待暂停按钮 */
export const ICON_PAUSE_CIRCLE = 'file://bin/public/icon/pause-circle.png';
/** 下一曲 */
export const ICON_NEXT = 'file://bin/public/icon/next.png';
/** 停止播放 */
export const ICON_STOP = 'file://bin/public/icon/stop.png';
/** 关闭 */
export const ICON_CLOSE = 'file://bin/public/icon/close.png';
/** 点击时坐标的随机范围 */
export const POINT_RANDOM = 20;

/** 关闭背包或者琴 */
export const IMG_CLOSE = 'bin/public/images/close.png';
/** 琴里的第一个音符 */
export const IMG_MUSIC_NOTE = 'bin/public/images/musicNote.png';
/** 背包 */
export const IMG_PACKAGE = 'bin/public/images/package.png';
/** 琴 */
export const IMG_PIANO = 'bin/public/images/piano.png';
/** 光翼能量 */
export const IMG_POWER = 'bin/public/images/power.png';
/** 点击后隔多长时间，再次截图检查有没有目标 */
export const CHECK_IMG_TIME = 1500;
/** adb截图保存路径  */
export const ADB_CAPTURE_SAVE = '/storage/emulated/0/脚本/adb_capture.png'
/** 智能打开演奏键盘的顶级入口处的按钮位置，一般是游戏背包按钮的触发位置 */
export const HOME_BTN_POSITION = { x: device.screenHeight / 2, y: 70 }
/** 智能打开演奏键盘的钢琴图标位置 */
export const PIANO_BTN_POSITION = { x: 1808, y: 588 }