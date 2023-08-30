/**
 * require.js 封装 v22.09.07
 * https://requirejs.org/
 *
 * require.js 的用法 - 阮一峰的网络日志
 * https://www.ruanyifeng.com/blog/2012/11/require_js.html
 *
 * 【升级记录】
 * ---------------------------------------------------------------
 * 新增自定义css加载器，以支持样式表paths数组 by Killsen @2022-09-07
 */

export default $require

interface RequireConfig {
    map  ?: Record<string, Record<string, string>>
    paths?: Record<string, string | string[]>
    shim ?: Record<string, {
        deps   ?: string[]
        exports?: string
        init   ?: Function
    }>
}

// 前端开源项目 CDN 加速服务
const CDNS = [
    'https://cdn.bootcdn.net/ajax/libs/',       // 1. BootCDN   https://www.bootcdn.cn/
    'https://lib.baomitu.com/',                 // 2. 360奇舞团  https://cdn.baomitu.com/
    'https://cdn.staticfile.org/',              // 3. 七牛云     https://www.staticfile.org/
    //  'https://cdnjs.cloudflare.com/ajax/libs/',  // 4. cdnjs      https://cdnjs.com/
    //  'https://cdn.jzzp.vip/libs/',               // 5. 三度CDN
]

// 初始配置
const CONF: RequireConfig = {
    map: {
        "*": {
            css : "require-css",   // css  加载器
            text: "require-text",  // text 加载器
        },
    },
    paths: {
        //  "require-css" : '@require-css/0.1.10/css.min',
        "require-text": '@require-text/2.0.12/text.min',
        "domReady"    : '@require-domReady/2.0.1/domReady.min',
    },
    shim: {},
}

let inited = false

// 定义模块
export function $define(name: string, deps: string[], cb: Function) {
    !inited && $config()
    const _define  = (window as any)['define']
    return _define(name, deps, cb)
}

// 加载模块
export function $require(deps: string[], cb?: Function) {
    !inited && $config()
    const _require = (window as any)['require']
    return _require(deps, cb)
}

$require.config = $config

// 模块配置
export function $config(conf?: RequireConfig) {
    const _window  = window as any
    const _require = _window['require']

    // 前端开源项目 CDN 加速服务
    const _cdns: string[] = _window["$CDNS"] || CDNS

    // 确保全局配置独一份
    const _conf: RequireConfig = _window["$CONF"] = _window["$CONF"] || { ...CONF }

    _conf.map   = { ..._conf.map  , ...conf?.map   }
    _conf.paths = { ..._conf.paths, ...conf?.paths }
    _conf.shim  = { ..._conf.shim , ...conf?.shim  }

    for (const name in _conf.paths) {
        let path = _conf.paths[name]

        // 以 @ 符号开头的字符串, 转成多个 cdn 路径
        if (typeof path === "string" && path.startsWith("@")) {
            path = path.substring(1)
            if (path.endsWith('.js')) {  // 去掉后缀名
                path = path.substring(0, path.length - 3)
            }
            _conf.paths[name] = _cdns.map(cdn => `${ cdn }${ path }`)
        } else if (Array.isArray(path)) {
            _conf.paths[name] = path.map( (p) => {
                if (p.endsWith('.js')) {  // 去掉后缀名
                    return p.substring(0, p.length - 3)
                } else {
                    return p
                }
            })
        }
    }

    for (const name in _conf.shim) {
        const shim = _conf.shim[name]
        if (!shim) continue

        const cdn = _cdns[0]
        if (!cdn) break

        // 以 css!@ 符号开头的字符串, 转成一个 cdn 路径
        if (Array.isArray(shim.deps)) {
            shim.deps = shim.deps.map( (p) => {
                if (p.startsWith('css!@')) {
                    return `css!${ cdn }${ p.substring(5) }`
                } else {
                    return p
                }
            })
        }
    }

    _require.config(_conf)

    if (!inited) {
        inited = true
        initCssLoader()
    }
}

// css! 样式表加载器
function initCssLoader() {
    const _define  = (window as any)['define']

    _define("require-css", [], () => {
        return { load }

        function addLink(props: any) {
            const link = Object.assign(document.createElement('link'), props)
            document.head.appendChild(link)
        }

        function _load(paths: string[], index: number, onLoad: Function) {
            let path = paths[index]
            if (!path) return onLoad()
            if (!path.endsWith(".css")) path = `${ path }.css`

            addLink({
                type   : "text/css",
                rel    : 'stylesheet',
                href   : path,
                onload : onLoad,
                onerror: () => _load(paths, index + 1, onLoad),
            })
        }

        function load(name: string, _req: any, onLoad: Function, config: RequireConfig) {
            const path = config.paths![name] || name

            if (typeof path === "string") {
                _load([path], 0, onLoad)
            } else if (Array.isArray(path)) {
                _load(path, 0, onLoad)
            } else {
                onLoad()
            }
        }
    })
}

